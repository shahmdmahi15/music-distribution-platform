import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get("__Host-SESSION_TOKEN")?.value;
  const pathname = request.nextUrl.pathname;
  const authRoutes = pathname.startsWith("/auth");

  const session = sessionToken;

  if (session && authRoutes) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!session && !authRoutes) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Explicitly pass through requests that don't match the redirect criteria
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude API routes, static files, image optimizations, and common image extensions
    "/((?!api|favicon.ico|_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|svg)$).*)",
  ],
};
