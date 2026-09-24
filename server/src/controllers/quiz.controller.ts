import type { Response } from 'express';
import { z } from 'zod';
import { Course } from '../models/Course.model.js';
import { QuizQuestion } from '../models/QuizQuestion.model.js';
import { Lesson } from '../models/Lesson.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { permissions } from '../services/permissions.service.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const optionSchema = z.object({
  id: z.string().min(1).max(20),
  text: z.string().min(1).max(500),
}).strict();

export const quizQuestionSchema = z.object({
  body: z.object({
    lessonId: z.string().min(1),
    prompt: z.string().min(1).max(2000),
    options: z.array(optionSchema).min(2).max(6),
    mode: z.enum(['single', 'multiple']).default('single'),
    correctOptionIds: z.array(z.string().min(1)).min(1),
    explanation: z.string().max(2000).optional(),
    order: z.number().int().min(1).default(1),
  }).strict(),
});

export const quizParamsSchema = z.object({
  params: z.object({ slug: z.string().min(1), lessonSlug: z.string().min(1).optional() }),
});

export const quizAnswerSchema = z.object({
  body: z.object({
    answers: z.record(z.union([z.string(), z.array(z.string())])),
  }).strict(),
});

async function getCourse(slug: string) {
  const course = await Course.findOne({ slug });
  if (!course) throw new ApiError(404, 'Course not found');
  return course;
}

async function getLessonId(courseId: string, lessonSlug?: string) {
  if (!lessonSlug) throw new ApiError(400, 'A lesson is required for quiz questions');
  const lesson = await Lesson.findOne({ courseId, slug: lessonSlug }).select('_id').lean();
  if (!lesson) throw new ApiError(404, 'Lesson not found');
  return lesson._id.toString();
}

export const quizController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await getCourse(String(req.params.slug));
    const lessonId = await getLessonId(course._id.toString(), String(req.params.lessonSlug));
    const questions = await QuizQuestion.find({ courseId: course._id.toString(), lessonId })
      .sort({ order: 1 })
      .select('-correctOptionId')
      .lean();
    return ApiResponse.success(res, questions);
  }),

  submit: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await getCourse(String(req.params.slug));
    const lessonId = await getLessonId(course._id.toString(), String(req.params.lessonSlug));
    const questions = await QuizQuestion.find({ courseId: course._id.toString(), lessonId })
      .sort({ order: 1 })
      .lean();
    const answers = req.body.answers as Record<string, string | string[]>;
    const correct = questions.filter((q) => {
      const expected = q.correctOptionIds?.length
        ? q.correctOptionIds
        : q.correctOptionId
          ? [q.correctOptionId]
          : [];
      const rawAnswer = answers[q._id.toString()];
      const actual = Array.isArray(rawAnswer) ? rawAnswer : rawAnswer ? [rawAnswer] : [];
      return expected.length === actual.length && expected.every((id) => actual.includes(id));
    }).length;
    return ApiResponse.success(res, {
      score: correct,
      total: questions.length,
      percentage: questions.length ? Math.round((correct / questions.length) * 100) : 0,
      results: questions.map((q) => ({
        questionId: q._id,
        correct: (() => {
          const expected = q.correctOptionIds?.length ? q.correctOptionIds : q.correctOptionId ? [q.correctOptionId] : [];
          const rawAnswer = answers[q._id.toString()];
          const actual = Array.isArray(rawAnswer) ? rawAnswer : rawAnswer ? [rawAnswer] : [];
          return expected.length === actual.length && expected.every((id) => actual.includes(id));
        })(),
        correctOptionIds: q.correctOptionIds?.length ? q.correctOptionIds : [q.correctOptionId],
        explanation: q.explanation,
      })),
    });
  }),

  manageList: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await getCourse(String(req.params.slug));
    const user = { _id: req.user!._id.toString(), role: req.user!.role };
    if (!permissions.canEditContent(user, course as unknown as Parameters<typeof permissions.canEditContent>[1])) {
      throw new ApiError(403, 'You do not have permission to edit this course');
    }
    const questions = await QuizQuestion.find({ courseId: course._id.toString() })
      .sort({ order: 1 })
      .lean();
    return ApiResponse.success(res, questions);
  }),

  create: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await getCourse(String(req.params.slug));
    const user = { _id: req.user!._id.toString(), role: req.user!.role };
    if (!permissions.canEditContent(user, course as unknown as Parameters<typeof permissions.canEditContent>[1])) {
      throw new ApiError(403, 'You do not have permission to edit this course');
    }
    const input = req.body;
    const lesson = await Lesson.findOne({
      _id: input.lessonId,
      courseId: course._id.toString(),
    }).select('_id').lean();
    if (!lesson) throw new ApiError(404, 'Lesson not found');
    const lessonId = lesson._id.toString();
    if (input.mode === 'single' && input.correctOptionIds.length !== 1) {
      throw new ApiError(400, 'Single-correct questions must have exactly one correct option');
    }
    if (input.correctOptionIds.some((id: string) => !input.options.some((option: { id: string }) => option.id === id))) {
      throw new ApiError(400, 'Every correct option must match one of the options');
    }
    const question = await QuizQuestion.create({
      ...input,
      correctOptionId: input.mode === 'single' ? input.correctOptionIds[0] : undefined,
      lessonId,
      courseId: course._id.toString(),
    });
    return ApiResponse.success(res, question.toObject(), 'Quiz question created', 201);
  }),

  remove: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await getCourse(String(req.params.slug));
    const user = { _id: req.user!._id.toString(), role: req.user!.role };
    if (!permissions.canEditContent(user, course as unknown as Parameters<typeof permissions.canEditContent>[1])) {
      throw new ApiError(403, 'You do not have permission to edit this course');
    }
    await QuizQuestion.deleteOne({ _id: req.params.questionId, courseId: course._id.toString() });
    return ApiResponse.success(res, { ok: true });
  }),
};
