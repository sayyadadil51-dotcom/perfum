import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// shadcn/ui button, tuned for ScrapKart: bigger tap targets on mobile.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[.98] [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-lift',
        destructive: 'bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90',
        outline: 'border border-border bg-card hover:bg-muted hover:text-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
        ghost: 'hover:bg-muted hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/70',
        white: 'bg-white text-leaf-800 shadow-soft hover:bg-white/90',
      },
      size: {
        default: 'h-11 px-5 [&_svg]:size-4',
        sm: 'h-9 rounded-lg px-3 text-xs [&_svg]:size-3.5',
        lg: 'h-13 rounded-xl px-7 text-base [&_svg]:size-5',
        icon: 'h-10 w-10 [&_svg]:size-5',
        'icon-sm': 'h-8 w-8 rounded-lg [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }));

    // Radix Slot requires exactly one child element, so the spinner is only
    // injected for real <button> elements (never when composing with asChild).
    if (asChild) {
      return (
        <Slot className={classes} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button className={classes} ref={ref} disabled={disabled || loading} {...props}>
        {loading && <Loader2 className="animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
