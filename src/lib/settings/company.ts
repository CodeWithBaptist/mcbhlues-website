import { inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { SITE_CONFIG } from "@/constants";

export interface CompanyInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

/**
 * Company details from Portal → Company Settings, falling back to the shipped
 * defaults. Used to personalise outgoing email signatures.
 */
export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const db = await getDb();
    const rows = await db
      .select({ key: settings.key, value: settings.value })
      .from(settings)
      .where(
        inArray(settings.key, [
          "company.name",
          "company.email",
          "company.phone",
          "company.address",
        ])
      );
    const values = new Map(rows.map((row) => [row.key, String(row.value ?? "").trim()]));
    return {
      name: values.get("company.name") || SITE_CONFIG.name,
      email: values.get("company.email") || SITE_CONFIG.contact.email,
      phone: values.get("company.phone") || SITE_CONFIG.contact.phone,
      address: values.get("company.address") || SITE_CONFIG.contact.address,
    };
  } catch {
    return {
      name: SITE_CONFIG.name,
      email: SITE_CONFIG.contact.email,
      phone: SITE_CONFIG.contact.phone,
      address: SITE_CONFIG.contact.address,
    };
  }
}
