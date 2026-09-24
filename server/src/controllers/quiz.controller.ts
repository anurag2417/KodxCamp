import type { Response } from 'express';
import { z } from 'zod';
import { Course } from '../models/Course.model.js';
import { QuizQuestion } from '../models/QuizQuestion.model.js';
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
    lessonId: z.string().optional(),
    prompt: z.string().min(1).max(2000),
    options: z.array(optionSchema).min(2).max(6),
    correctOptionId: z.string().min(1),
    explanation: z.string().max(2000).optional(),
    order: z.number().int().min(1).default(1),
  }).strict(),
});

export const quizParamsSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
});

export const quizAnswerSchema = z.object({
  body: z.object({
    answers: z.record(z.string()),
  }).strict(),
});

async function getCourse(slug: string) {
  const course = await Course.findOne({ slug });
  if (!course) throw new ApiError(404, 'Course not found');
  return course;
}

export const quizController = {
  list: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await getCourse(String(req.params.slug));
    const questions = await QuizQuestion.find({ courseId: course._id.toString() })
      .sort({ order: 1 })
      .select('-correctOptionId')
      .lean();
    return ApiResponse.success(res, questions);
  }),

  submit: asyncHandler(async (req: AuthRequest, res: Response) => {
    const course = await getCourse(String(req.params.slug));
    const questions = await QuizQuestion.find({ courseId: course._id.toString() })
      .sort({ order: 1 })
      .lean();
    const answers = req.body.answers as Record<string, string>;
    const correct = questions.filter((q) => answers[q._id.toString()] === q.correctOptionId).length;
    return ApiResponse.success(res, {
      score: correct,
      total: questions.length,
      percentage: questions.length ? Math.round((correct / questions.length) * 100) : 0,
      results: questions.map((q) => ({
        questionId: q._id,
        correct: answers[q._id.toString()] === q.correctOptionId,
        correctOptionId: q.correctOptionId,
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
    if (!input.options.some((option: { id: string }) => option.id === input.correctOptionId)) {
      throw new ApiError(400, 'Correct option must match one of the options');
    }
    const question = await QuizQuestion.create({
      ...input,
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
