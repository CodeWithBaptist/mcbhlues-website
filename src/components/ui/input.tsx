import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Paints the invalid state. Pair it with `aria-invalid` and `aria-describedby`. */
  error?: boolean;
}

/**
 * Text input.
 *
 * Contrast notes: the 1px border is `gray-500` (4.8:1 on white) so the field
 * boundary meets WCAG 1.4.11 for non-text UI, and the placeholder is
 * `gray-500` rather than `gray-400` (2.5:1, a fail).
 *
 * Interaction: the border darkens on hover, and focus paints both a 2px
 * outline (keyboard) and a soft tinted halo so the active field is obvious
 * without relying on colour alone.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error = false, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(
          "flex h-12 w-full rounded-md border bg-white px-4 py-2 text-base text-dark shadow-2xs transition-all duration-200 ease-soft",
          "placeholder:text-gray-500",
          "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          "disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none",
          error
            ? "border-red-700 ring-red-700/10 focus:border-red-700 focus:ring-4 focus-visible:outline-red-700"
            : "border-gray-500 hover:border-gray-700 focus:border-primary focus:ring-4 focus:ring-primary/10",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
