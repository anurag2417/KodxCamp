import { api } from '@/shared/lib/api';

export type ActivityProgressStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed';

export interface ApiProgress {
  _id: string | null;
  userId: string;
  courseId: string;
  completedLessons: string[];
  currentLessonId?: string;
  currentStepIndex: number;
  completedSteps: number[];
  completedChallenges: Record<string, number[]>;
  percentage: number;
}

export interface ApiActivityProgress {
  _id: string;
  userId: string;
  courseId: string;
  curriculumItemId: string;
  status: ActivityProgressStatus;
  startedAt?: string;
  completedAt?: string;
  attempts: number;
  score?: number;
  timeSpentSeconds: number;
  completedStepIndexes: number[];
  completedChallengeIndexes: number[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiActivityProgressResponse {
  curriculumItemId: string;
  progress: ApiActivityProgress | null;
}

export interface ApiCourseActivityProgress {
  curriculumItemId: string;
  status: ActivityProgressStatus;
  percentage: number;
  attempts: number;
  score?: number;
  timeSpentSeconds: number;
  completedStepIndexes: number[];
  completedChallengeIndexes: number[];
  startedAt?: string;
  completedAt?: string;
  updatedAt?: string;
}

export interface ApiActivityProgressListResponse {
  courseId: string;
  progress: ApiCourseActivityProgress[];
}

export interface ApiProgressSummary {
  totalRequired: number;
  completedRequired: number;
  percentage: number;
}

export interface ApiSectionProgress extends ApiProgressSummary {
  sectionId: string;
}

export interface ApiModuleProgress extends ApiProgressSummary {
  moduleId: string;
}

export interface ApiCourseActivitySummary extends ApiProgressSummary {
  courseId: string;
}

export interface ApiOverview {
  lessonsCompleted: number;
  coursesInProgress: number;
  coursesCompleted: number;
  problemsSolved: number;
  problemsAttempted: number;
  projectsStarted: number;
  projectsCompleted: number;
  classesAttended: number;
  recordingsWatched: number;
  totalXp: number;
  activeDays30: number;
  totalActivities: number;
}

export interface ApiCourseProgress {
  courseId: string;
  title: string;
  slug: string;
  language: string;
  completedLessons: number;
  totalLessons: number;
  percentage: number;
  updatedAt: string;
}

export interface ApiDifficulty {
  easy: number;
  medium: number;
  hard: number;
}

export interface ApiWeeklyXp {
  weekStart: string;
  xp: number;
  activities: number;
}

export interface ApiHeatmapDay {
  day: string;
  count: number;
  xp: number;
}

export interface ApiActivity {
  _id: string;
  type: string;
  xp: number;
  title: string;
  link: string;
  createdAt: string;
}

export interface StartActivityInput {
  courseId: string;
  curriculumItemId: string;
}

export interface UpdateActivityProgressInput {
  courseId: string;
  curriculumItemId: string;
  timeSpentSeconds?: number;
  score?: number;
}

export interface CompleteActivityInput {
  courseId: string;
  curriculumItemId: string;
  score?: number;
  timeSpentSeconds?: number;
}

export interface CompleteActivityStepInput {
  courseId: string;
  curriculumItemId: string;
  stepIndex: number;
}

export interface CompleteActivityChallengeInput {
  courseId: string;
  curriculumItemId: string;
  challengeIndex: number;
}

export const progressApi = {
  getForCourse: async (courseId: string): Promise<ApiProgress> => {
    const { data } = await api.get(`/progress/${courseId}`);
    return data.data;
  },

  markComplete: async (
    courseId: string,
    lessonId: string
  ): Promise<ApiProgress> => {
    const { data } = await api.post('/progress/complete', {
      courseId,
      lessonId,
    });

    return data.data;
  },

  markStepComplete: async (
    courseId: string,
    lessonId: string,
    stepIndex: number
  ): Promise<ApiProgress> => {
    const { data } = await api.post('/progress/complete-step', {
      courseId,
      lessonId,
      stepIndex,
    });

    return data.data;
  },

  markChallengeComplete: async (
    courseId: string,
    lessonId: string,
    challengeIndex: number
  ): Promise<ApiProgress> => {
    const { data } = await api.post('/progress/complete-challenge', {
      courseId,
      lessonId,
      challengeIndex,
    });

    return data.data;
  },

  getActivity: async (
    courseId: string,
    curriculumItemId: string
  ): Promise<ApiActivityProgressResponse> => {
    const { data } = await api.get(
      `/activity-progress/course/${courseId}/item/${curriculumItemId}`
    );

    return data.data;
  },

  getActivityProgressForCourse: async (
    courseId: string
  ): Promise<ApiActivityProgressListResponse> => {
    const { data } = await api.get(`/activity-progress/course/${courseId}`);

    return data.data;
  },

  getCourseActivityProgress: async (
    courseId: string
  ): Promise<ApiCourseActivitySummary> => {
    const { data } = await api.get(
      `/activity-progress/course/${courseId}/progress`
    );

    return data.data;
  },

  getModuleActivityProgress: async (
    courseId: string,
    moduleId: string
  ): Promise<ApiModuleProgress> => {
    const { data } = await api.get(
      `/activity-progress/course/${courseId}/module/${moduleId}`
    );

    return data.data;
  },

  getSectionActivityProgress: async (
    courseId: string,
    sectionId: string
  ): Promise<ApiSectionProgress> => {
    const { data } = await api.get(
      `/activity-progress/course/${courseId}/section/${sectionId}`
    );

    return data.data;
  },

  startActivity: async (
    input: StartActivityInput
  ): Promise<ApiActivityProgress> => {
    const { data } = await api.post('/activity-progress/start', input);

    return data.data;
  },

  updateActivityProgress: async (
    input: UpdateActivityProgressInput
  ): Promise<ApiActivityProgress> => {
    const { data } = await api.patch('/activity-progress', input);

    return data.data;
  },

  completeActivity: async (
    input: CompleteActivityInput
  ): Promise<ApiActivityProgress> => {
    const { data } = await api.post('/activity-progress/complete', input);

    return data.data;
  },

  markActivityStepComplete: async (
    input: CompleteActivityStepInput
  ): Promise<ApiActivityProgress> => {
    const { data } = await api.post(
      '/activity-progress/step/complete',
      input
    );

    return data.data;
  },

  markActivityChallengeComplete: async (
    input: CompleteActivityChallengeInput
  ): Promise<ApiActivityProgress> => {
    const { data } = await api.post(
      '/activity-progress/challenge/complete',
      input
    );

    return data.data;
  },

  overview: async (): Promise<ApiOverview> => {
    const { data } = await api.get('/analytics/overview');

    return data.data;
  },

  perCourse: async (): Promise<ApiCourseProgress[]> => {
    const { data } = await api.get('/analytics/courses');

    return data.data;
  },

  difficulty: async (): Promise<ApiDifficulty> => {
    const { data } = await api.get('/analytics/difficulty');

    return data.data;
  },

  weekly: async (weeks = 12): Promise<ApiWeeklyXp[]> => {
    const { data } = await api.get('/analytics/weekly', {
      params: { weeks },
    });

    return data.data;
  },

  heatmap: async (days = 365): Promise<ApiHeatmapDay[]> => {
    const { data } = await api.get('/analytics/heatmap', {
      params: { days },
    });

    return data.data;
  },

  recentActivity: async (): Promise<ApiActivity[]> => {
    const { data } = await api.get('/analytics/activity');

    return data.data;
  },
};