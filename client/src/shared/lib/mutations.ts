import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  problemsApi,
  type ApiSubmission,
} from '@/features/problems/api';
import { progressApi } from '@/features/progress/api';
import { projectsApi } from '@/features/projects/api';
import { queryKeys } from '@/shared/lib/queryKeys';

export function useSubmitSolution() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof problemsApi.submit>[0]) =>
      problemsApi.submit(input),
    onSuccess: (data, variables) => {
      qc.setQueryData<ApiSubmission[]>(
        queryKeys.problems.submissions(variables.problemId),
        (prev = []) => [data, ...prev]
      );
      qc.invalidateQueries({ queryKey: queryKeys.problems.all });
    },
  });
}

export function useMarkLessonComplete() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      lessonId,
    }: {
      courseId: string;
      lessonId: string;
    }) => progressApi.markComplete(courseId, lessonId),
    onSuccess: (_data, { courseId }) => {
      qc.invalidateQueries({
        queryKey: queryKeys.progress.course(courseId),
      });
      qc.invalidateQueries({ queryKey: queryKeys.progress.overview });
    },
  });
}

export function useSaveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      files,
    }: {
      slug: string;
      files: Parameters<typeof projectsApi.save>[1];
    }) => projectsApi.save(slug, files),
    onSuccess: (_data, { slug }) => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.detail(slug) });
      qc.invalidateQueries({ queryKey: queryKeys.projects.mine });
    },
  });
}