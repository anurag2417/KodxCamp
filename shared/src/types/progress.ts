export interface IProgress {
  _id: string | null;
  userId: string;
  courseId: string;
  completedLessons: string[];
  currentLessonId?: string;
  /**
   * Web-lesson step tracking. See the note on `IProgress` in the
   * server's Progress.model.ts for the backward-compatibility
   * guarantee.
   */
  currentStepIndex?: number;
  completedSteps?: number[];
  /**
   * Tutorial challenge completion.
   *
   * Keyed by lesson id. The value is the sorted list of completed
   * challenge indexes for that lesson. A lesson with no completed
   * challenges is either absent from this map or maps to an empty
   * array; readers should treat both as equivalent.
   *
   * The whole map is stored as a single field so the read path is
   * one query, not N.
   */
  completedChallenges?: Record<string, number[]>;
  percentage: number;
  updatedAt: Date;
}