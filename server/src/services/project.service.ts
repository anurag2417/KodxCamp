import { Project } from '../models/Project.model.js';
import { UserProject } from '../models/UserProject.model.js';
import { User } from '../models/User.model.js';
import { ApiError } from '../utils/ApiError.js';
import { activityService } from './activity.service.js';

export const projectService = {
  async listAll(userId?: string) {
    const projects = await Project.find()
      .select('-files -longDescription -instructions')
      .sort({ category: 1, difficulty: 1, createdAt: 1 })
      .lean();

    if (!userId) {
      return projects.map((p) => ({ ...p, userStatus: null }));
    }

    const userProjects = await UserProject.find({ userId }).lean();
    const byProject = new Map(userProjects.map((up) => [up.projectId, up]));

    return projects.map((p) => {
      const up = byProject.get(p._id.toString());
      return {
        ...p,
        userStatus: up
          ? { status: up.status, completedAt: up.completedAt }
          : null,
      };
    });
  },

  async getBySlug(slug: string, userId?: string) {
    const project = await Project.findOne({ slug }).lean();
    if (!project) throw new ApiError(404, 'Project not found');

    let userProject = null;
    if (userId) {
      userProject = await UserProject.findOne({
        userId,
        projectId: project._id.toString(),
      }).lean();
    }

    return { project, userProject };
  },

  async startOrGetUserProject(userId: string, projectSlug: string) {
    const project = await Project.findOne({ slug: projectSlug }).lean();
    if (!project) throw new ApiError(404, 'Project not found');

    let userProject = await UserProject.findOne({
      userId,
      projectId: project._id.toString(),
    });

    if (!userProject) {
      userProject = await UserProject.create({
        userId,
        projectId: project._id.toString(),
        files: project.files.map((f) => ({ ...f })),
        status: 'in_progress',
      });

      // Log the first-time start
      await activityService.record({
        userId,
        type: 'project_saved',
        refId: project._id.toString(),
        xp: 0,
      });
    }

    return { project, userProject: userProject.toObject() };
  },

  async saveUserProject(
    userId: string,
    projectSlug: string,
    files: { name: string; language: string; content: string; isEntry?: boolean }[]
  ) {
    const project = await Project.findOne({ slug: projectSlug }).lean();
    if (!project) throw new ApiError(404, 'Project not found');

    const existing = await UserProject.findOne({
      userId,
      projectId: project._id.toString(),
    });

    if (!existing) {
      const created = await UserProject.create({
        userId,
        projectId: project._id.toString(),
        files,
        status: 'in_progress',
      });

      // First save = "started"
      await activityService.record({
        userId,
        type: 'project_saved',
        refId: project._id.toString(),
        xp: 0,
      });

      return created.toObject();
    }

    existing.files = files as typeof existing.files;
    await existing.save();
    return existing.toObject();
  },

  async completeUserProject(userId: string, projectSlug: string) {
    const project = await Project.findOne({ slug: projectSlug }).lean();
    if (!project) throw new ApiError(404, 'Project not found');

    const up = await UserProject.findOne({
      userId,
      projectId: project._id.toString(),
    });
    if (!up) throw new ApiError(404, 'Project not started');

    if (up.status !== 'completed') {
      up.status = 'completed';
      up.completedAt = new Date();
      await up.save();

      await activityService.record({
        userId,
        type: 'project_completed',
        refId: project._id.toString(),
        xp: project.xpReward,
      });
    }

    return up.toObject();
  },

  async listUserProjects(userId: string) {
    const userProjects = await UserProject.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    const projectIds = userProjects.map((up) => up.projectId);
    const projects = await Project.find({ _id: { $in: projectIds } })
      .select('-files')
      .lean();
    const byId = new Map(projects.map((p) => [p._id.toString(), p]));

    return userProjects
      .map((up) => {
        const p = byId.get(up.projectId);
        if (!p) return null;
        return {
          _id: up._id,
          status: up.status,
          completedAt: up.completedAt,
          updatedAt: up.updatedAt,
          project: p,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  },
};

// Keep this import referenced for future use — TypeScript unused warning.
void User;