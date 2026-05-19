import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 1. Protect Dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      // Not authenticated
      const url = new URL("/login", request.url);
      return NextResponse.redirect(url);
    }

    if (!token.emailVerified) {
      // Authenticated but email is unverified
      const url = new URL("/login", request.url);
      url.searchParams.set("error", "unverified");
      if (token.email) {
        url.searchParams.set("email", token.email);
      }
      return NextResponse.redirect(url);
    }
  }

  // 2. Redirect verified users away from public auth pages
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password");

  if (isAuthPage && token && token.emailVerified) {
    const url = new URL("/dashboard", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password/:path*",
  ],
};
