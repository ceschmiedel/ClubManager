import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./prisma";
import {
  SESSION_COOKIE,
  assinarSessao,
  lerToken,
  type SessionPayload,
} from "./session";

export type { SessionPayload };

export async function criarSessao(payload: SessionPayload) {
  const token = await assinarSessao(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function encerrarSessao() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export const getSessao = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  return lerToken(store.get(SESSION_COOKIE)?.value);
});

export async function exigirSessao(): Promise<SessionPayload> {
  const s = await getSessao();
  if (!s) throw new Error("Não autenticado");
  return s;
}

export async function exigirAdmin(): Promise<SessionPayload> {
  const s = await exigirSessao();
  if (s.role !== "ADMIN" && s.role !== "SUPER_ADMIN")
    throw new Error("Acesso restrito a administradores");
  return s;
}

export async function usuarioDaSessao() {
  const s = await getSessao();
  if (!s) return null;
  return prisma.usuario.findUnique({
    where: { id: s.sub },
    include: { atleta: true },
  });
}
