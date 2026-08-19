import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, lerToken } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const isPublic = req.nextUrl.pathname.startsWith("/login");
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  // Valida o JWT de fato: um cookie presente mas expirado/inválido (ex.: o
  // AUTH_SECRET mudou) não pode ser tratado como sessão ativa, senão o
  // middleware manda para "/" e o layout manda de volta para "/login",
  // criando um laço infinito de redirects que impede o login.
  const sessao = await lerToken(token);

  if (!isPublic && !sessao) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  if (isPublic && !sessao && token) {
    // Já estamos na página pública: só limpa o cookie inválido.
    const res = NextResponse.next();
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  if (isPublic && sessao) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|uploads|.*\\..*).*)"],
};
