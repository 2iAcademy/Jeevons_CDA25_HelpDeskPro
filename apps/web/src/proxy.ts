import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
] as const;

function hasSessionCookie(request: {
  cookies: { get: (name: string) => { value?: string } | undefined };
}): boolean {
  return SESSION_COOKIES.some((name) => request.cookies.get(name)?.value);
}

function clearSessionCookies(response: NextResponse): NextResponse {
  for (const name of SESSION_COOKIES) {
    response.cookies.delete(name);
  }
  return response;
}

export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/login";
  const isPublic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico";

  if (isPublic) return NextResponse.next();

  const isLoggedIn = !!request.auth;

  if (!isLoggedIn && !isLoginPage) {
    const response = NextResponse.redirect(new URL("/login", request.nextUrl));
    if (hasSessionCookie(request)) {
      clearSessionCookies(response);
    }
    return response;
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/tickets", request.nextUrl));
  }

  if (!isLoggedIn && isLoginPage && hasSessionCookie(request)) {
    return clearSessionCookies(NextResponse.next());
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
