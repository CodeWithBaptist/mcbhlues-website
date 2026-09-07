import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Paints the invalid state. Pair it with `aria-invalid` and `aria-describedby`. */
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error = false, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(
          // 16px text stops iOS Safari zooming in when the field is focused.
          "flex min-h-[120px] w-full rounded-md border bg-white px-4 py-3 text-base text-dark transition-all",
          "placeholder:text-gray-500",
          "focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          "disabled:cursor-not-allowed disabled:opacity-60",
          error
            ? "border-red-700 focus-visible:outline-red-700"
            : "border-gray-500 focus:border-primary",
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
