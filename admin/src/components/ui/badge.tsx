import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300",
        accent: "border-transparent bg-accent text-accent-foreground",
        destructive: "border-red-200 bg-red-50 text-destructive dark:border-red-900 dark:bg-red-950",
        outline: "border-border text-muted-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export function Badge({
  className,
  variant,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
