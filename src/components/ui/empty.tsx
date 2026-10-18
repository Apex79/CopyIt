import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const emptyMediaVariants = cva(
  'flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    defaultVariants: {
      variant: 'default',
    },
    variants: {
      variant: {
        default: 'bg-transparent',
        icon: 'relative flex size-12 shrink-0 items-center justify-center rounded-2xl border border-surface-200 dark:border-surface-700/60 bg-surface-100/80 dark:bg-surface-800/80 text-surface-600 dark:text-surface-300 shadow-xs [&_svg]:size-5',
      },
    },
  }
);

export function Empty({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center justify-center gap-3 text-balance px-6 py-12 text-center md:py-16',
        className
      )}
      data-slot="empty"
      {...props}
    />
  );
}

export function EmptyHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      className={cn(
        'flex max-w-sm flex-col items-center text-center',
        className
      )}
      data-slot="empty-header"
      {...props}
    />
  );
}

export function EmptyMedia({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> &
  VariantProps<typeof emptyMediaVariants>): React.ReactElement {
  return (
    <div
      className={cn('relative mb-3', className)}
      data-slot="empty-media"
      data-variant={variant}
      {...props}
    >
      <div
        className={cn(emptyMediaVariants({ className, variant }))}
        {...props}
      />
    </div>
  );
}

export function EmptyTitle({
  className,
  ...props
}: React.ComponentProps<'h3'>): React.ReactElement {
  return (
    <h3
      className={cn('text-sm font-semibold text-surface-900 dark:text-surface-100', className)}
      data-slot="empty-title"
      {...props}
    />
  );
}

export function EmptyDescription({
  className,
  ...props
}: React.ComponentProps<'p'>): React.ReactElement {
  return (
    <p
      className={cn('text-xs text-surface-500 dark:text-surface-400 mt-1 leading-relaxed', className)}
      data-slot="empty-description"
      {...props}
    />
  );
}

export function EmptyContent({
  className,
  ...props
}: React.ComponentProps<'div'>): React.ReactElement {
  return (
    <div
      className={cn('flex flex-wrap items-center justify-center gap-2 mt-2', className)}
      data-slot="empty-content"
      {...props}
    />
  );
}
