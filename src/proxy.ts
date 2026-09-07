import NextAuth, { type NextAuthRequest } from "next-auth";
import { authConfig } from "@/shared/lib/auth-config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((request: NextAuthRequest) => {
  const isLoggedIn = Boolean(request.auth?.user);
  const pathname = request.nextUrl.pathname;

  if (!isLoggedIn && pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (Auth.js handles these itself)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon, fonts and common asset files
     * - uploaded local files under /uploads
     */
    "/((?!api/auth|uploads|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff2?)$).*)",
  ],
};
