import { cn } from '@/shared/lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    className={cn(
      'animate-pulse rounded-md bg-surface-tertiary',
      className
    )}
  />
);

export const CourseCardSkeleton: React.FC = () => (
  <div className="rounded-xl border border-border bg-surface p-5">
    <Skeleton className="h-6 w-20" />
    <Skeleton className="mt-3 h-5 w-3/4" />
    <Skeleton className="mt-2 h-4 w-full" />
    <Skeleton className="mt-2 h-4 w-2/3" />
    <Skeleton className="mt-5 h-2 w-full" />
    <Skeleton className="mt-2 h-3 w-1/2" />
  </div>
);
