import type { UserRole } from "@/types/database";

/** Home path per role after login. */
export function homePathForRole(role: UserRole | null): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "DRIVER":
      return "/driver/dashboard";
    case "CUSTOMER":
      return "/customer/dashboard";
    default:
      return "/login";
  }
}

/** True when the given URL is a protected portal route. */
export function isPortalPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/driver") ||
    pathname.startsWith("/customer")
  );
}

/** Returns the portal name for a protected path, if any. */
export function portalForPath(pathname: string): UserRole | null {
  if (pathname.startsWith("/admin")) return "ADMIN";
  if (pathname.startsWith("/driver")) return "DRIVER";
  if (pathname.startsWith("/customer")) return "CUSTOMER";
  return null;
}