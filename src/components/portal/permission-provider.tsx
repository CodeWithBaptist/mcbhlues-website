"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { hasPermission, type PermissionMode } from "@/lib/rbac/can";

export interface SessionUserView {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: { key: string; name: string; level: number }[];
  level: number;
  permissions: string[];
}

interface PermissionContextValue {
  user: SessionUserView;
  can: (required: string | string[], mode?: PermissionMode) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({
  user,
  children,
}: {
  user: SessionUserView;
  children: ReactNode;
}) {
  const value = useMemo<PermissionContextValue>(
    () => ({
      user,
      can: (required, mode = "any") => hasPermission(user.permissions, required, mode),
    }),
    [user]
  );

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function useSession() {
  const context = useContext(PermissionContext);
  if (!context) throw new Error("useSession must be used inside a PermissionProvider");
  return context;
}

/** Convenience hook: `const can = usePermission();  can("staff:create")` */
export function usePermission() {
  return useSession().can;
}

/**
 * UX-only conditional renderer. Hiding a control is never the security
 * boundary — the matching server action / API route performs its own check.
 */
export function Can({
  permission,
  mode = "any",
  fallback = null,
  children,
}: {
  permission: string | string[];
  mode?: PermissionMode;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  const can = usePermission();
  return <>{can(permission, mode) ? children : fallback}</>;
}
