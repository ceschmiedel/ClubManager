import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./prisma";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret"
);

export type SessionPayload = {
  sub: string; // usuarioId
  nome: string;
  role: "SUPER_ADMIN" | "ADMIN" | "ATLETA";
  atletaId?: string;
};

export async function criarSessao(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
  const store = await cookies();
  store.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function encerrarSessao() {
  const store = await cookies();
  store.delete("session");
}

export const getSessao = cache(async (): Promise<SessionPayload | null> => {
  const store = await cookies();
  const token = store.get("session")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, secret);
    return {
      sub: payload.sub!,
      nome: payload.nome,
      role: payload.role,
      atletaId: payload.atletaId,
    };
  } catch {
    return null;
  }
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
