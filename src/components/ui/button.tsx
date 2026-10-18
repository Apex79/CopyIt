import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-primary-600 text-white shadow-xs hover:bg-primary-700 active:bg-primary-800 dark:bg-primary-600 dark:hover:bg-primary-500',
        secondary:
          'bg-primary-100/70 text-primary-900 hover:bg-primary-100 active:bg-primary-200/80 dark:bg-primary-950/50 dark:text-primary-200 dark:hover:bg-primary-900/60 border border-primary-200/60 dark:border-primary-800/40',
        outline:
          'border border-surface-200 dark:border-surface-700 bg-white/80 dark:bg-surface-900/80 text-surface-800 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-800 shadow-2xs',
        ghost:
          'text-surface-700 dark:text-surface-300 hover:bg-surface-100/80 dark:hover:bg-surface-800/60 hover:text-surface-900 dark:hover:text-surface-100',
        destructive:
          'bg-red-600 text-white shadow-xs hover:bg-red-700 active:bg-red-800 dark:bg-red-700 dark:hover:bg-red-600',
        destructiveOutline:
          'border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40',
        link:
          'text-primary-600 dark:text-primary-400 underline-offset-4 hover:underline p-0 h-auto font-normal active:scale-100',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-10 rounded-xl px-5 text-sm font-semibold',
        icon: 'h-9 w-9 p-0',
        iconSm: 'h-7.5 w-7.5 rounded-lg p-0 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
