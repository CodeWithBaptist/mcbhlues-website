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
        "flex flex-col gap-4 max-w-3xl mb-12",
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
      <h2 className="text-3xl md:text-5xl font-extrabold text-dark leading-tight">
        {title}
      </h2>
      {description && (
        <p className="text-lg text-gray-600 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
