import { api } from './api';

export type ProjectCategory =
  | 'frontend'
  | 'react'
  | 'api'
  | 'sql'
  | 'dataviz'
  | 'javascript';

export type ProjectDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type PreviewMode = 'html' | 'react' | 'sql' | 'none';

export interface ApiProjectFile {
  name: string;
  language: string;
  content: string;
  isEntry?: boolean;
}

export interface ApiProjectSummary {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: ProjectCategory;
  difficulty: ProjectDifficulty;
  topics: string[];
  estimatedMinutes: number;
  xpReward: number;
  previewMode: PreviewMode;
  userStatus: { status: 'in_progress' | 'completed'; completedAt?: string } | null;
}

export interface ApiProjectFull {
  _id: string;
  title: string;
  slug: string;
  description: string;
  longDescription: string;
  category: ProjectCategory;
  difficulty: ProjectDifficulty;
  topics: string[];
  files: ApiProjectFile[];
  previewMode: PreviewMode;
  instructions: string;
  estimatedMinutes: number;
  xpReward: number;
}

export interface ApiUserProject {
  _id: string;
  userId: string;
  projectId: string;
  files: ApiProjectFile[];
  status: 'in_progress' | 'completed';
  completedAt?: string;
  updatedAt: string;
}

export const projectsApi = {
  list: async (): Promise<ApiProjectSummary[]> => {
    const { data } = await api.get('/projects');
    return data.data;
  },

  getBySlug: async (
    slug: string
  ): Promise<{ project: ApiProjectFull; userProject: ApiUserProject | null }> => {
    const { data } = await api.get(`/projects/${slug}`);
    return data.data;
  },

  start: async (slug: string): Promise<{ project: ApiProjectFull; userProject: ApiUserProject }> => {
    const { data } = await api.post(`/projects/${slug}/start`);
    return data.data;
  },

  save: async (slug: string, files: ApiProjectFile[]): Promise<ApiUserProject> => {
    const { data } = await api.post(`/projects/${slug}/save`, { files });
    return data.data;
  },

  complete: async (slug: string): Promise<ApiUserProject> => {
    const { data } = await api.post(`/projects/${slug}/complete`);
    return data.data;
  },

  mine: async (): Promise<
    { _id: string; status: string; completedAt?: string; updatedAt: string; project: ApiProjectFull }[]
  > => {
    const { data } = await api.get('/projects/mine');
    return data.data;
  },
};