import { redirect } from "next/navigation";

/**
 * The previous prototype admin area used a single hardcoded password.
 * It is superseded by the RBAC-protected Staff Portal.
 */
export default function AdminRedirectPage() {
  redirect("/portal");
}
