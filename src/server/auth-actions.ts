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

// Auto-cadastro de atleta com código de convite do clube
export async function cadastrarComConvite(
  _prev: { erro?: string } | undefined,
  formData: FormData
) {
  const codigo = String(formData.get("codigo") ?? "").trim().toUpperCase();
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!codigo || !nome || !email || !senha)
    return { erro: "Preencha todos os campos" };
  if (senha.length < 6)
    return { erro: "A senha precisa ter pelo menos 6 caracteres" };

  const clube = await prisma.clube.findFirst();
  if (!clube?.codigoConvite || clube.codigoConvite.toUpperCase() !== codigo)
    return { erro: "Código de convite inválido. Confirme com um administrador do clube." };

  if (await prisma.usuario.findUnique({ where: { email } }))
    return { erro: "Já existe uma conta com esse e-mail" };

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senhaHash: await bcrypt.hash(senha, 10),
      role: "ATLETA",
      atleta: { create: {} },
    },
    include: { atleta: true },
  });
  await criarSessao({
    sub: usuario.id,
    nome: usuario.nome,
    role: usuario.role,
    atletaId: usuario.atleta?.id,
  });
  redirect("/");
}
