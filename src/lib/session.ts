// Utilitários de sessão sem dependência do Prisma — podem rodar no middleware
// (edge runtime), onde o client do Prisma não está disponível.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "session";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret"
);

export type SessionPayload = {
  sub: string; // usuarioId
  nome: string;
  role: "SUPER_ADMIN" | "ADMIN" | "ATLETA";
  atletaId?: string;
};

export async function assinarSessao(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

/** Retorna a sessão do token ou null se ele for inválido/expirado. */
export async function lerToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, secret);
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      nome: payload.nome,
      role: payload.role,
      atletaId: payload.atletaId,
    };
  } catch {
    return null;
  }
}
