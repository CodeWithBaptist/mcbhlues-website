import Link from "next/link";
import { cn } from "@/lib/utils";
import { SITE_CONFIG } from "@/constants";

interface LogoProps {
  href?: string;
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

export function Logo({ className, light = false, logoUrl, name = SITE_CONFIG.name, href = "/" }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label={`${name} — ${href === "/" ? "go to the homepage" : "Staff Portal"}`}
      className={cn(
        "flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary",
        className
      )}
    >
      {logoUrl ? (
        /* Staff-uploaded brand asset of unknown intrinsic size. The box is fixed
           by CSS so there is no layout shift, and the file is already compressed
           at upload time. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={`${name} logo`}
          width={180}
          height={40}
          decoding="async"
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
