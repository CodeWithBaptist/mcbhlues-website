import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

// Contrast against white / the surface the button sits on:
//   primary   #2563EB on #FFF  → 5.1:1 (white text on it → 5.1:1)  ✓ AA
//   secondary #1E3A8A on #FFF  → 10.8:1                            ✓ AAA
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  secondary: "bg-primary-dark text-white hover:bg-primary",
  outline: "border-2 border-primary text-primary hover:bg-primary hover:text-white",
  ghost: "text-primary hover:bg-background-soft",
};

// Minimum 44px tall from `md` up — WCAG 2.5.8 target size.
const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-[38px] px-3.5 py-2 text-sm",
  md: "min-h-[44px] px-6 py-2.5 text-base",
  lg: "min-h-[52px] px-8 py-3.5 text-lg font-semibold",
};

/**
 * The button look, without the `<button>` element.
 *
 * Use this on a `<Link>`/`<a>` that should *look* like a button. Wrapping a
 * real `<button>` in an anchor is invalid HTML (interactive content inside
 * interactive content) and gives keyboard and screen-reader users two stops
 * for one action.
 *
 *     <Link href="/contact" className={buttonClasses({ size: "lg" })}>
 *       Book a consultation
 *     </Link>
 */
export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center rounded-md text-center transition-all duration-200",
    // focus-visible (not focus) so a mouse click doesn't paint a ring.
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    "disabled:pointer-events-none disabled:opacity-60",
    VARIANTS[variant],
    SIZES[size],
    className
  );
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button ref={ref} className={buttonClasses({ variant, size, className })} {...props} />
  )
);

Button.displayName = "Button";

export { Button };
export type { ButtonVariant, ButtonSize };
