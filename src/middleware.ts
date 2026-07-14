import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const isPublic = req.nextUrl.pathname.startsWith("/login");
  const hasSession = req.cookies.has("session");
  if (!isPublic && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (isPublic && hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|uploads|.*\\..*).*)"],
};
