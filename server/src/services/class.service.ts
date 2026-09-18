import { Class } from '../models/Class.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { ApiError } from '../utils/ApiError.js';
import { activityService } from './activity.service.js';

const XP_FOR_ATTENDANCE = 15;
const XP_FOR_WATCHING = 10;

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base || `class-${Date.now()}`;
  let n = 1;
  while (await Class.exists({ slug })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export const classService = {
  async list(
    filter: { scope?: 'upcoming' | 'past' | 'all' },
    userId?: string
  ) {
    const now = new Date();
    const query: Record<string, unknown> = {};

    if (filter.scope === 'upcoming') {
      query.scheduledAt = { $gte: new Date(now.getTime() - 60 * 60 * 1000) };
      query.status = { $in: ['scheduled', 'live'] };
    } else if (filter.scope === 'past') {
      query.$or = [
        { scheduledAt: { $lt: new Date(now.getTime() - 60 * 60 * 1000) } },
        { status: 'ended' },
      ];
    }

    const classes = await Class.find(query)
      .sort({ scheduledAt: filter.scope === 'past' ? -1 : 1 })
      .lean();

    if (!userId) {
      return classes.map((c) => ({ ...c, enrolled: false }));
    }

    const ids = classes.map((c) => c._id.toString());
    const enrollments = await Enrollment.find({
      userId,
      classId: { $in: ids },
    }).lean();
    const byClass = new Map(enrollments.map((e) => [e.classId, e]));

    return classes.map((c) => ({
      ...c,
      enrolled: byClass.has(c._id.toString()),
      enrollment: byClass.get(c._id.toString()) ?? null,
    }));
  },

  async getBySlug(slug: string, userId?: string) {
    const cls = await Class.findOne({ slug }).lean();
    if (!cls) throw new ApiError(404, 'Class not found');

    let enrollment = null;
    if (userId) {
      enrollment = await Enrollment.findOne({
        userId,
        classId: cls._id.toString(),
      }).lean();
    }

    const attendeeCount = await Enrollment.countDocuments({
      classId: cls._id.toString(),
    });

    return { class: cls, enrollment, attendeeCount };
  },

  async create(input: {
    title: string;
    description: string;
    scheduledAt: string;
    durationMinutes: number;
    meetLink: string;
    courseId?: string;
    instructor: { _id: string; name: string };
  }) {
    const slug = await ensureUniqueSlug(slugify(input.title));

    const created = await Class.create({
      title: input.title,
      slug,
      description: input.description,
      instructorId: input.instructor._id,
      instructorName: input.instructor.name,
      courseId: input.courseId,
      scheduledAt: new Date(input.scheduledAt),
      durationMinutes: input.durationMinutes,
      meetLink: input.meetLink,
      status: 'scheduled',
    });

    return created.toObject();
  },

  async update(
    slug: string,
    instructorId: string,
    patch: Partial<{
      title: string;
      description: string;
      scheduledAt: string;
      durationMinutes: number;
      meetLink: string;
      status: 'scheduled' | 'live' | 'ended' | 'cancelled';
    }>
  ) {
    const cls = await Class.findOne({ slug });
    if (!cls) throw new ApiError(404, 'Class not found');
    if (cls.instructorId !== instructorId) {
      throw new ApiError(403, 'Only the instructor can edit this class');
    }

    if (patch.title) cls.title = patch.title;
    if (patch.description !== undefined) cls.description = patch.description;
    if (patch.scheduledAt) cls.scheduledAt = new Date(patch.scheduledAt);
    if (patch.durationMinutes) cls.durationMinutes = patch.durationMinutes;
    if (patch.meetLink) cls.meetLink = patch.meetLink;
    if (patch.status) cls.status = patch.status;

    await cls.save();
    return cls.toObject();
  },

  async attachRecording(
    slug: string,
    instructorId: string,
    recording: {
      url: string;
      durationSec: number;
      sizeBytes: number;
      chapters?: { title: string; startSec: number }[];
    }
  ) {
    const cls = await Class.findOne({ slug });
    if (!cls) throw new ApiError(404, 'Class not found');
    if (cls.instructorId !== instructorId) {
      throw new ApiError(403, 'Only the instructor can upload recordings');
    }

    cls.recording = {
      url: recording.url,
      durationSec: recording.durationSec,
      sizeBytes: recording.sizeBytes,
      uploadedAt: new Date(),
      chapters: recording.chapters ?? [],
    };
    cls.status = 'ended';
    await cls.save();
    return cls.toObject();
  },

  async enroll(slug: string, userId: string) {
    const cls = await Class.findOne({ slug }).lean();
    if (!cls) throw new ApiError(404, 'Class not found');

    const existing = await Enrollment.findOne({
      userId,
      classId: cls._id.toString(),
    });
    if (existing) return existing.toObject();

    const created = await Enrollment.create({
      userId,
      classId: cls._id.toString(),
      joinedAt: new Date(),
    });
    return created.toObject();
  },

  async unenroll(slug: string, userId: string) {
    const cls = await Class.findOne({ slug }).lean();
    if (!cls) throw new ApiError(404, 'Class not found');
    await Enrollment.deleteOne({ userId, classId: cls._id.toString() });
    return { ok: true };
  },

  async markAttended(slug: string, userId: string) {
    const cls = await Class.findOne({ slug }).lean();
    if (!cls) throw new ApiError(404, 'Class not found');

    const e = await Enrollment.findOne({ userId, classId: cls._id.toString() });
    if (!e) throw new ApiError(400, 'Not enrolled in this class');

    if (!e.attendedAt) {
      e.attendedAt = new Date();
      await e.save();
      await activityService.record({
        userId,
        type: 'class_attended',
        refId: cls._id.toString(),
        xp: XP_FOR_ATTENDANCE,
      });
    }
    return e.toObject();
  },

  /**
   * Update recording watch progress.
   *
   * Idempotent XP: recording_watched activity is logged only ONCE per enrollment
   * (when watchedSeconds >= 90% of duration). Subsequent calls just bump
   * watchedSeconds.
   */
  async updateWatchProgress(
    slug: string,
    userId: string,
    watchedSeconds: number,
    durationSec: number
  ) {
    const cls = await Class.findOne({ slug }).lean();
    if (!cls) throw new ApiError(404, 'Class not found');

    const e = await Enrollment.findOne({ userId, classId: cls._id.toString() });
    if (!e) throw new ApiError(400, 'Not enrolled in this class');

    // Only advance forward — never let client set a lower value
    const prev = e.watchedSeconds ?? 0;
    if (watchedSeconds > prev) {
      e.watchedSeconds = watchedSeconds;
    }

    // Award XP exactly once, on first crossing of 90%
    const threshold = durationSec * 0.9;
    const justCompleted =
      !e.recordingCompletedAt && threshold > 0 && (e.watchedSeconds ?? 0) >= threshold;

    if (justCompleted) {
      e.recordingCompletedAt = new Date();
    }

    await e.save();

    if (justCompleted) {
      await activityService.record({
        userId,
        type: 'recording_watched',
        refId: cls._id.toString(),
        xp: XP_FOR_WATCHING,
      });
    }

    return e.toObject();
  },

  async listMyRecordings(userId: string) {
    const enrollments = await Enrollment.find({ userId }).lean();
    const classIds = enrollments.map((e) => e.classId);
    const classes = await Class.find({
      _id: { $in: classIds },
      'recording.url': { $exists: true },
    })
      .sort({ 'recording.uploadedAt': -1 })
      .lean();

    const byClass = new Map(enrollments.map((e) => [e.classId, e]));

    return classes.map((c) => {
      const e = byClass.get(c._id.toString())!;
      const duration = c.recording?.durationSec ?? 0;
      const watched = e.watchedSeconds ?? 0;
      const pct =
        duration > 0 ? Math.min(100, Math.round((watched / duration) * 100)) : 0;
      return {
        class: c,
        watchedSeconds: watched,
        recordingCompletedAt: e.recordingCompletedAt ?? null,
        percentWatched: pct,
      };
    });
  },
};