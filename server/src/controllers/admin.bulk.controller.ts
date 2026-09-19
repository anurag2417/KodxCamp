import type { Response } from 'express';
import { z } from 'zod';
import { bulkService } from '../services/bulk.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

export const importSchema = z.object({
  body: z.object({
    kind: z.enum(['problems', 'projects', 'courses']),
    mode: z.enum(['merge', 'replace']).default('merge'),
    dryRun: z.boolean().default(false),
    items: z.unknown(),
  }),
});

export const adminBulkController = {
  import: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { kind, mode, dryRun, items } = req.body;

    let report;
    if (kind === 'problems') {
      report = await bulkService.importProblems(items, mode, dryRun);
    } else if (kind === 'projects') {
      report = await bulkService.importProjects(items, mode, dryRun);
    } else {
      report = await bulkService.importCourses(items, mode, dryRun);
    }

    const message = dryRun
      ? 'Dry run complete — nothing saved'
      : `Imported: ${report.created} created, ${report.updated} updated`;

    return ApiResponse.success(res, report, message);
  }),
};