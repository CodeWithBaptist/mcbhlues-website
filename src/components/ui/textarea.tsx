import * as React from "react";
import { cn } from "@/lib/utils";
import { bulletListKeydown } from "@/lib/bullet-list";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Paints the invalid state. Pair it with `aria-invalid` and `aria-describedby`. */
  error?: boolean;
  /**
   * Auto-continuing bullet lists: `* ` at the start of a line becomes `• `,
   * Enter continues the list, Enter on an empty bullet exits it.
   * Only affects typing — existing text is never reformatted.
   */
  bulletList?: boolean;
}

/**
 * React tracks the last value it rendered, so assigning `el.value` directly is
 * swallowed. Go through the native setter and fire an `input` event so
 * controlled parents receive a normal onChange.
 */
function setTextareaValue(el: HTMLTextAreaElement, value: string, selection: number) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  setter ? setter.call(el, value) : (el.value = value);
  el.setSelectionRange(selection, selection);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  // Re-apply after React's re-render, which can reset the caret to the end.
  el.setSelectionRange(selection, selection);
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => el.setSelectionRange(selection, selection));
  }
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error = false, bulletList = false, onKeyDown, ...props }, ref) => {
    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        onKeyDown?.(event);
        if (!bulletList || event.defaultPrevented) return;
        if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

        const el = event.currentTarget;
        const edit = bulletListKeydown({
          key: event.key,
          value: el.value,
          selectionStart: el.selectionStart ?? 0,
          selectionEnd: el.selectionEnd ?? 0,
        });
        if (!edit) return;

        event.preventDefault();
        setTextareaValue(el, edit.value, edit.selection);
      },
      [bulletList, onKeyDown]
    );

    return (
      <textarea
        ref={ref}
        onKeyDown={handleKeyDown}
        aria-invalid={error || undefined}
        className={cn(
          // 16px text stops iOS Safari zooming in when the field is focused.
          "flex min-h-[120px] w-full rounded-md border bg-white px-4 py-3 text-base text-dark shadow-2xs transition-all duration-200 ease-soft",
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
Textarea.displayName = "Textarea";
