import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE_CONFIG } from "@/constants";

interface LogoProps {
  className?: string;
  light?: boolean;
  /**
   * Uploaded logo image (the `company.logo` setting from Portal → Company
   * Settings). When set, it replaces the default text logo.
   */
  logoUrl?: string | null;
  /** Used as the alt text for the image logo. */
  name?: string;
}

export function Logo({ className, light = false, logoUrl, name = SITE_CONFIG.name }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- staff-uploaded brand asset served from /api/uploads, sized by CSS
        <img
          src={logoUrl}
          alt={name}
          className="h-10 w-auto max-w-[180px] object-contain"
        />
      ) : (
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
      )}
    </Link>
  );
}
