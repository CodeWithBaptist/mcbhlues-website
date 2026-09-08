import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-12 flex max-w-3xl flex-col gap-4",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && (
        <span
          className={cn(
            "flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-primary",
            align === "center" && "justify-center"
          )}
        >
          {align === "center" && (
            <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
          )}
          {eyebrow}
          {align === "center" && (
            <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
          )}
        </span>
      )}
      <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight text-dark md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="text-base leading-relaxed text-gray-600 sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
