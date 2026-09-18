export interface IProgress {
  _id: string;
  userId: string;
  courseId: string;
  completedLessons: string[];
  currentLessonId?: string;
  percentage: number;
  updatedAt: Date;
}