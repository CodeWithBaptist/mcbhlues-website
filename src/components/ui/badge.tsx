import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "light";
  className?: string;
}

export function Badge({ children, variant = "primary", className }: BadgeProps) {
  const variants = {
    primary: "bg-primary text-white shadow-sm shadow-primary/30",
    secondary: "bg-primary-dark text-white shadow-sm shadow-primary-dark/30",
    outline: "border border-primary text-primary",
    light: "bg-background-soft text-primary-dark",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors duration-200",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
