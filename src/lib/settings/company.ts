import { inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { SITE_CONFIG } from "@/constants";

export interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  /** URL of the uploaded logo image (`company.logo`), or null for the text logo. */
  logoUrl: string | null;
  socials: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
}

/** Every settings key in the `company` scope that the public website reads. */
export const COMPANY_SETTING_KEYS = [
  "company.name",
  "company.email",
  "company.phone",
  "company.address",
  "company.logo",
  "company.facebook",
  "company.instagram",
  "company.twitter",
  "company.linkedin",
] as const;

function defaults(): CompanyInfo {
  return {
    name: SITE_CONFIG.name,
    email: SITE_CONFIG.contact.email,
    phone: SITE_CONFIG.contact.phone,
    address: SITE_CONFIG.contact.address,
    logoUrl: null,
    socials: { facebook: "", instagram: "", twitter: "", linkedin: "" },
  };
}

/**
 * Company details from Portal → Company Settings, falling back to the shipped
 * defaults. Powers the public website (navbar, footer, contact page, map) and
 * personalises outgoing email signatures.
 */
export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const db = await getDb();
    const rows = await db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(inArray(settings.key, [...COMPANY_SETTING_KEYS]));
    const values = new Map(rows.map((row) => [row.key, String(row.value ?? "").trim()]));
    const fallback = defaults();
    return {
      name: values.get("company.name") || fallback.name,
      email: values.get("company.email") || fallback.email,
      phone: values.get("company.phone") || fallback.phone,
      address: values.get("company.address") || fallback.address,
      logoUrl: values.get("company.logo") || null,
      socials: {
        facebook: values.get("company.facebook") ?? fallback.socials.facebook,
        instagram: values.get("company.instagram") ?? fallback.socials.instagram,
        twitter: values.get("company.twitter") ?? fallback.socials.twitter,
        linkedin: values.get("company.linkedin") ?? fallback.socials.linkedin,
      },
    };
  } catch {
    return defaults();
  }
}
