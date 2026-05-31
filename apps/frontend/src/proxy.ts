import { NextRequest, NextResponse } from "next/server";

interface TokenPayload {
  userId: string;
  role: "ADMIN" | "ATTENDANT" | "CLIENT";
}

function decodeToken(token: string): TokenPayload | null {
  try {
    // JWT usa base64url — troca - e _ antes do atob
    const base64url = token.split(".")[1];
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

const DASHBOARD_PREFIXES = ["/dashboard", "/tickets", "/clients", "/users"];
const PORTAL_PREFIXES = ["/portal/tickets"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value ?? null;
  const payload = token ? decodeToken(token) : null;
  const role = payload?.role ?? null;

  const isDashboard = DASHBOARD_PREFIXES.some((p) => pathname.startsWith(p));
  const isPortal = PORTAL_PREFIXES.some((p) => pathname.startsWith(p));

  if (isDashboard) {
    if (!role) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role === "CLIENT") {
      return NextResponse.redirect(new URL("/portal/tickets", request.url));
    }
  }

  if (isPortal) {
    if (!role) {
      return NextResponse.redirect(new URL("/portal/login", request.url));
    }
    if (role !== "CLIENT") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tickets/:path*",
    "/clients/:path*",
    "/users/:path*",
    "/portal/tickets/:path*",
  ],
};
