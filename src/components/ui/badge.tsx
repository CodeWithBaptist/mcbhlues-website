import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "light";
  className?: string;
}

export function Badge({ children, variant = "primary", className }: BadgeProps) {
  const variants = {
    primary: "bg-primary text-white",
    secondary: "bg-primary-dark text-white",
    outline: "border border-primary text-primary",
    light: "bg-background-soft text-primary-dark",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors duration-200",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
