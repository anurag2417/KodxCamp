import { api } from '@/shared/lib/api';

export interface ApiProgress {
  _id: string | null;
  userId: string;
  courseId: string;
  completedLessons: string[];
  currentLessonId?: string;
  currentStepIndex: number;
  completedSteps: number[];
  percentage: number;
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

export const progressApi = {
  getForCourse: async (courseId: string): Promise<ApiProgress> => {
    const { data } = await api.get(`/progress/${courseId}`);
    return data.data;
  },

  markComplete: async (courseId: string, lessonId: string): Promise<ApiProgress> => {
    const { data } = await api.post('/progress/complete', { courseId, lessonId });
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
    const { data } = await api.get('/analytics/weekly', { params: { weeks } });
    return data.data;
  },

  heatmap: async (days = 365): Promise<ApiHeatmapDay[]> => {
    const { data } = await api.get('/analytics/heatmap', { params: { days } });
    return data.data;
  },

  recentActivity: async (): Promise<ApiActivity[]> => {
    const { data } = await api.get('/analytics/activity');
    return data.data;
  },
};