import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-primary text-brand-secondary hover:bg-brand-accentBlue",
        secondary:
          "border-transparent bg-brand-accentLavender text-brand-primary",
        outline: "border-brand-accentPeriwinkle text-brand-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps): JSX.Element => {
  return <div className={cn(badgeVariants({ className, variant }))} {...props} />;
};
