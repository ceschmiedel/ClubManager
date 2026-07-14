"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { criarSessao, encerrarSessao } from "@/lib/auth";

export async function login(
  _prev: { erro?: string } | undefined,
  formData: FormData
) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const usuario = await prisma.usuario.findUnique({
    where: { email },
    include: { atleta: true },
  });
  if (!usuario || !usuario.ativo || !(await bcrypt.compare(senha, usuario.senhaHash))) {
    return { erro: "E-mail ou senha inválidos" };
  }
  await criarSessao({
    sub: usuario.id,
    nome: usuario.nome,
    role: usuario.role,
    atletaId: usuario.atleta?.id,
  });
  redirect("/");
}

export async function logout() {
  await encerrarSessao();
  redirect("/login");
}
