"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Label + control + error wrapper that wires up the accessibility attributes
 * every validated field needs:
 *
 *   <label for>            → clicking the label focuses the control
 *   aria-describedby       → screen readers announce the hint and the error
 *   role="alert"           → a newly-shown error is announced immediately
 *   aria-invalid           → set by the caller on the control itself
 *
 * Use it via the render prop so the ids stay in one place:
 *
 *   <FormField id="email" label="Email address" required error={errors.email}>
 *     {(props) => <Input type="email" {...props} />}
 *   </FormField>
 */

export interface FieldRenderProps {
  id: string;
  name: string;
  required?: boolean;
  "aria-describedby"?: string;
  error: boolean;
}

interface FormFieldProps {
  id: string;
  label: string;
  /** Defaults to `id`. */
  name?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  children: (props: FieldRenderProps) => React.ReactNode;
}

export function FormField({
  id,
  label,
  name,
  hint,
  error,
  required = false,
  className,
  labelClassName,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <label
        htmlFor={id}
        className={cn(
          "block text-sm font-bold uppercase tracking-wider text-gray-700",
          labelClassName
        )}
      >
        {label}
        {required ? (
          <>
            {" "}
            <span aria-hidden="true" className="text-red-700">
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        ) : (
          <span className="ml-1 font-medium normal-case tracking-normal text-gray-600">
            (optional)
          </span>
        )}
      </label>

      {hint && (
        <p id={hintId} className="text-sm text-gray-600">
          {hint}
        </p>
      )}

      {children({
        id,
        name: name ?? id,
        required,
        "aria-describedby": describedBy,
        error: Boolean(error),
      })}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex animate-fade-up items-start gap-1.5 text-sm font-medium text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
