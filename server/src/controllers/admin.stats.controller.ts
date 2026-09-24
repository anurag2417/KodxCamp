import type { Response } from 'express';
import { adminService } from '../services/admin.service.js';
import { User } from '../models/User.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const adminStatsController = {
  platform: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const stats = await adminService.platformStats();
    return ApiResponse.success(res, stats);
  }),

  listUsers: asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(100, Number(req.query.limit ?? 20));
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;

    const result = await adminService.listUsers({ search, role, page, limit });
    return ApiResponse.success(res, result);
  }),

  /**
   * Minimal instructor list for pickers. Returns only the fields a
   * dropdown needs, sorted by name. Includes both `instructor` and
   * `admin` because an admin can also teach a class.
   */
  listInstructors: asyncHandler(async (_req: AuthRequest, res: Response) => {
    const instructors = await User.find({
      role: { $in: ['instructor', 'admin'] },
      accountStatus: 'active',
    })
      .select('_id name email role avatar')
      .sort({ name: 1 })
      .lean();

    return ApiResponse.success(res, instructors);
  }),

  setUserRole: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const { role } = req.body;
    const updated = await adminService.setUserRole(userId, role);
    return ApiResponse.success(res, updated, 'Role updated');
  }),

  deleteUser: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { userId } = req.params;
    const actorId = req.user!._id.toString();
    const result = await adminService.deleteUser(userId, actorId);
    return ApiResponse.success(res, result, 'User deleted');
  }),
};