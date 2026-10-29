import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "./lib/auth/token";

// Routes that do not require authentication
const PUBLIC_AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Always allow Next.js internals, static assets, and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|css|js|map|txt)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Allow Public & Emergency APIs and Recipient Live-Share Viewer
  // (In accordance with Requirement 7: Do not gate life-saving emergency data behind a login)
  if (
    pathname.startsWith("/live-share") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/emergency") ||
    pathname.startsWith("/api/places") ||
    pathname.startsWith("/api/news") ||
    pathname.startsWith("/api/cctv") ||
    pathname.startsWith("/api/safety") ||
    pathname.startsWith("/api/zones")
  ) {
    return NextResponse.next();
  }

  // 3. Check for session cookie
  const sessionCookie = request.cookies.get("nshield_session")?.value;
  let session = null;

  if (sessionCookie) {
    session = await verifySessionToken(sessionCookie);
  }

  const isAuthRoute = PUBLIC_AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // 4. If user is already authenticated and visits an auth page (like /login or /register),
  // redirect them to the dashboard or safe returnUrl
  if (session && isAuthRoute) {
    const returnUrl = request.nextUrl.searchParams.get("returnUrl") || "/";
    return NextResponse.redirect(new URL(returnUrl, request.url));
  }

  // 5. If user is unauthenticated and visits a public auth route, allow access
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // 6. Only protect authenticated routes (like /emergency-circle management)
  const isProtectedRoute = pathname.startsWith("/emergency-circle");

  if (!session && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    const returnPath = pathname + search;
    if (returnPath && returnPath !== "/") {
      loginUrl.searchParams.set("returnUrl", returnPath);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 7. Proceed with request (add user headers if authenticated session is present)
  const response = NextResponse.next();
  if (session) {
    response.headers.set("x-user-id", session.user.id);
    response.headers.set("x-user-role", session.user.role);
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

