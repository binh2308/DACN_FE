import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";


const NOT_FOUND_PATH = "/404";

// map role 
const ROLE_ROUTE_PREFIX: Record<string, string> = {
  USER: "/user",
  ADMIN: "/admin",
  MANAGER: "/manager",
};

function getAllowedPrefixFromRoles(roles: unknown): string | null {
  //if (!Array.isArray(roles)) return null;

  if (roles === "ADMIN") return ROLE_ROUTE_PREFIX.ADMIN;
  if (roles === "MANAGER") return ROLE_ROUTE_PREFIX.MANAGER;
  if (roles === "USER") return ROLE_ROUTE_PREFIX.USER;

  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected =
    pathname.startsWith("/user") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/manager");

  if (!isProtected) return NextResponse.next();

  // Get token from cookie.
  const token = req.cookies.get("access_token")?.value;
  if (!token) {
    // không có token => coi như không có quyền
    return NextResponse.rewrite(new URL(NOT_FOUND_PATH, req.url));
  }

  try {
    // decode token để lấy ra roles

    const payload = decodeJwt(token);

    const allowedPrefix = getAllowedPrefixFromRoles((payload as any).roles);
    console.log("Middleware check roles:", payload.roles, "=> allowedPrefix:", allowedPrefix);
    if (!allowedPrefix) {
      return NextResponse.rewrite(new URL(NOT_FOUND_PATH, req.url));
    }

  
    if (!pathname.startsWith(allowedPrefix)) {
      return NextResponse.rewrite(new URL(NOT_FOUND_PATH, req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.rewrite(new URL(NOT_FOUND_PATH, req.url));
  }
}

export const config = {
  matcher: ["/user/:path*", "/admin/:path*", "/manager/:path*"],
};