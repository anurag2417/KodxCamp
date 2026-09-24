import crypto from 'node:crypto';
import {
  Invitation,
  type InvitationRole,
} from '../models/Invitation.model.js';
import { Course } from '../models/Course.model.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { emailService } from './email.service.js';
import { courseMembershipService } from './courseMembership.service.js';
import { logger } from '../utils/logger.js';

const TTL_DAYS = 7;

function hashToken(raw: string): string {
  return crypto
    .createHash('sha256')
    .update(`${raw}${env.AUTH_PEPPER}`)
    .digest('hex');
}

function generateRaw(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Course team invitations.
 *
 * As of Batch 2D, a course's team lives entirely in the
 * `CourseMembership` collection. Accepting an invitation creates a
 * membership row; it does not touch any embedded array.
 */
export const invitationService = {
  async create(input: {
    courseId: string;
    email: string;
    role: InvitationRole;
    invitedBy: string;
  }): Promise<{ invitationId: string }> {
    const email = input.email.toLowerCase().trim();

    const course = await Course.findById(input.courseId).lean();
    if (!course) {
      throw new ApiError(404, 'Course not found.');
    }

    // Refuse if the email already belongs to a team member.
    const existingUser = await User.findOne({ email }).select('_id').lean();
    if (existingUser) {
      const alreadyOnTeam =
        (await courseMembershipService.isMember(
          existingUser._id.toString(),
          input.courseId
        )) || course.createdBy === existingUser._id.toString();

      if (alreadyOnTeam) {
        throw new ApiError(409, 'This person is already on the team.');
      }
    }

    const pending = await Invitation.findOne({
      courseId: input.courseId,
      email,
      status: 'pending',
    }).lean();

    if (pending) {
      throw new ApiError(
        409,
        'There is already a pending invitation for this email.'
      );
    }

    const raw = generateRaw();
    const tokenHash = hashToken(raw);
    const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);

    const invitation = await Invitation.create({
      courseId: input.courseId,
      email,
      role: input.role,
      invitedBy: input.invitedBy,
      tokenHash,
      status: 'pending',
      expiresAt,
    });

    const inviteUrl = `${env.CLIENT_URL[0]}/invitations/${invitation._id.toString()}.${raw}`;

    try {
      const inviter = await User.findById(input.invitedBy).lean();
      await emailService.send({
        to: email,
        template: 'invitation',
        data: {
          inviterName: inviter?.name ?? 'A KodxCamp instructor',
          courseName: course.title,
          role: input.role,
          acceptUrl: inviteUrl,
          expiresInDays: TTL_DAYS,
        },
        refModel: 'Invitation',
        refId: invitation._id.toString(),
      });
    } catch (err) {
      logger.warn('Invitation email failed to send', {
        email,
        err: err instanceof Error ? err.message : String(err),
      });
    }

    if (!env.EMAIL_ENABLED && env.NODE_ENV !== 'production') {
      logger.info('Invitation link (dev, EMAIL_ENABLED=false)', {
        email,
        courseId: input.courseId,
        inviteUrl,
      });
    }

    return { invitationId: invitation._id.toString() };
  },

  async listForCourse(courseId: string) {
    return Invitation.find({ courseId })
      .sort({ createdAt: -1 })
      .lean();
  },

  async resolve(rawToken: string): Promise<{
    invitation: InstanceType<typeof Invitation>;
    course: InstanceType<typeof Course>;
    isExpired: boolean;
    isAlreadyAccepted: boolean;
    isRevoked: boolean;
  }> {
    const dot = rawToken.indexOf('.');
    if (dot <= 0) {
      throw new ApiError(400, 'This invitation link is invalid.');
    }

    const invitationId = rawToken.slice(0, dot);
    const random = rawToken.slice(dot + 1);
    const tokenHash = hashToken(random);

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      throw new ApiError(404, 'This invitation no longer exists.');
    }

    const expected = Buffer.from(invitation.tokenHash, 'hex');
    const actual = Buffer.from(tokenHash, 'hex');
    const matches =
      expected.length === actual.length &&
      crypto.timingSafeEqual(expected, actual);

    if (!matches) {
      throw new ApiError(400, 'This invitation link is invalid.');
    }

    const isExpired = invitation.expiresAt.getTime() < Date.now();
    const isAlreadyAccepted = invitation.status === 'accepted';
    const isRevoked = invitation.status === 'revoked';

    if (isExpired && invitation.status === 'pending') {
      invitation.status = 'expired';
      await invitation.save();
    }

    const course = await Course.findById(invitation.courseId).lean();
    if (!course) {
      throw new ApiError(404, 'The course for this invitation was deleted.');
    }

    return {
      invitation,
      course: course as unknown as InstanceType<typeof Course>,
      isExpired,
      isAlreadyAccepted,
      isRevoked,
    };
  },

  async accept(input: {
    rawToken: string;
    userId: string;
  }): Promise<{ courseSlug: string }> {
    const { invitation, course, isExpired, isAlreadyAccepted, isRevoked } =
      await this.resolve(input.rawToken);

    if (isRevoked) {
      throw new ApiError(400, 'This invitation was revoked.');
    }
    if (isAlreadyAccepted) {
      throw new ApiError(400, 'This invitation has already been accepted.');
    }
    if (isExpired) {
      throw new ApiError(400, 'This invitation has expired.');
    }

    const user = await User.findById(input.userId);
    if (!user) {
      throw new ApiError(404, 'User not found.');
    }

    if (user.email.toLowerCase() !== invitation.email) {
      throw new ApiError(
        403,
        `This invitation is for ${invitation.email}. You are signed in as ${user.email}.`
      );
    }

    const courseDoc = await Course.findById(course._id).lean();
    if (!courseDoc) {
      throw new ApiError(404, 'Course not found.');
    }

    const courseId = courseDoc._id.toString();

    const alreadyOnTeam =
      (await courseMembershipService.isMember(input.userId, courseId)) ||
      courseDoc.createdBy === input.userId;

    if (!alreadyOnTeam) {
      await courseMembershipService.upsert({
        userId: input.userId,
        courseId,
        role: invitation.role as
          | 'lead'
          | 'course_author'
          | 'problem_author'
          | 'class_coordinator'
          | 'ta'
          | 'viewer',
        addedBy: invitation.invitedBy,
      });
    }

    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    invitation.acceptedBy = input.userId;
    await invitation.save();

    return { courseSlug: courseDoc.slug };
  },

  async revoke(invitationId: string, courseId: string): Promise<void> {
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      throw new ApiError(404, 'Invitation not found.');
    }
    if (invitation.courseId !== courseId) {
      throw new ApiError(400, 'Invitation does not belong to this course.');
    }
    if (invitation.status !== 'pending') {
      throw new ApiError(400, 'Only pending invitations can be revoked.');
    }
    invitation.status = 'revoked';
    await invitation.save();
  },

  async expireStale(): Promise<number> {
    const result = await Invitation.updateMany(
      { status: 'pending', expiresAt: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    );
    return result.modifiedCount;
  },
};