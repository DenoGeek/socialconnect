const ADMIN_ROLES = ["admin", "super_admin", "concierge"] as const;

export function isAdminRole(role: string) {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/** Where to send the user immediately after a successful sign-in. */
export function getPostLoginPath(role: string, redirect?: string | null) {
  if (isAdminRole(role)) {
    if (redirect?.startsWith("/admin")) return redirect;
    return "/admin";
  }
  return redirect ?? "/apply/status";
}
