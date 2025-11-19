import { clsx } from 'clsx';

type SkeletonProps = {
  className?: string;
};

const Skeleton = ({ className }: SkeletonProps) => (
  <div className={clsx('animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700', className)} aria-hidden />
);

export default Skeleton;
