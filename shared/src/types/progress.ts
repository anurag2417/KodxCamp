export interface IProgress {
  _id: string | null;
  userId: string;
  courseId: string;
  completedLessons: string[];
  currentLessonId?: string;
  /**
   * Web-lesson step tracking.
   *
   * These fields are only meaningful for lessons that have a non-empty
   * `steps` array. For all other lessons they stay at their defaults.
   *
   * EXISTING DOCUMENTS: neither field exists on documents created
   * before the step feature shipped. Every read path in the service
   * layer MUST treat `undefined` the same as the default
   * (`currentStepIndex: 0`, `completedSteps: []`). There is no
   * backfill migration.
   */
  currentStepIndex?: number;
  completedSteps?: number[];
  percentage: number;
  updatedAt: Date;
}