import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  light?: boolean;
}

export function Logo({ className, light = false }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <div className="flex flex-col leading-tight">
        <span className={cn(
          "text-xl font-extrabold tracking-tighter sm:text-2xl font-heading uppercase",
          light ? "text-white" : "text-primary-dark"
        )}>
          MCBHLUES
        </span>
        <span className={cn(
          "text-[10px] font-medium tracking-[0.2em] uppercase",
          light ? "text-primary-light" : "text-primary"
        )}>
          Enterprises
        </span>
      </div>
    </Link>
  );
}
