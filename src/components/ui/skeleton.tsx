import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-surface-200/70 dark:bg-surface-800/60',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
