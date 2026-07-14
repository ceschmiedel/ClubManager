"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Posicao, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/auth";

function campo(formData: FormData, k: string) {
  const s = String(formData.get(k) ?? "").trim();
  return s === "" ? null : s;
}

export async function criarFuncionario(
  _prev: { erro?: string } | undefined,
  formData: FormData
) {
  await exigirAdmin();
  const email = campo(formData, "email")?.toLowerCase();
  const nome = campo(formData, "nome");
  const senha = campo(formData, "senha");
  if (!email || !nome || !senha) return { erro: "Preencha nome, e-mail e senha" };
  if (await prisma.usuario.findUnique({ where: { email } }))
    return { erro: "Já existe usuário com esse e-mail" };
  await prisma.usuario.create({
    data: {
      nome,
      email,
      senhaHash: await bcrypt.hash(senha, 10),
      role: (campo(formData, "role") as Role) ?? "ADMIN",
      telefone: campo(formData, "telefone"),
    },
  });
  revalidatePath("/funcionarios");
  redirect("/funcionarios");
}

export async function criarAtleta(
  _prev: { erro?: string } | undefined,
  formData: FormData
) {
  await exigirAdmin();
  const email = campo(formData, "email")?.toLowerCase();
  const nome = campo(formData, "nome");
  const senha = campo(formData, "senha");
  if (!email || !nome || !senha) return { erro: "Preencha nome, e-mail e senha" };
  if (await prisma.usuario.findUnique({ where: { email } }))
    return { erro: "Já existe usuário com esse e-mail" };
  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      senhaHash: await bcrypt.hash(senha, 10),
      role: "ATLETA",
      telefone: campo(formData, "telefone"),
      atleta: {
        create: {
          apelido: campo(formData, "apelido"),
          posicao: (campo(formData, "posicao") as Posicao) ?? "MEIA",
          posicaoFutsal: (campo(formData, "posicaoFutsal") as Posicao) ?? null,
          numeroCamisa: campo(formData, "numeroCamisa") ? Number(campo(formData, "numeroCamisa")) : null,
          nascimento: campo(formData, "nascimento") ? new Date(campo(formData, "nascimento")!) : null,
          peDominante: campo(formData, "peDominante"),
          tipoSanguineo: campo(formData, "tipoSanguineo"),
          convenio: campo(formData, "convenio"),
          contatoEmergenciaNome: campo(formData, "contatoEmergenciaNome"),
          contatoEmergenciaFone: campo(formData, "contatoEmergenciaFone"),
        },
      },
    },
    include: { atleta: true },
  });
  revalidatePath("/atletas");
  redirect(`/atletas/${usuario.atleta!.id}`);
}

export async function editarAtleta(
  _prev: { erro?: string } | undefined,
  formData: FormData
) {
  await exigirAdmin();
  const atletaId = String(formData.get("atletaId"));
  const atleta = await prisma.atleta.findUnique({ where: { id: atletaId } });
  if (!atleta) return { erro: "Atleta não encontrado" };
  await prisma.usuario.update({
    where: { id: atleta.usuarioId },
    data: {
      nome: campo(formData, "nome") ?? undefined,
      telefone: campo(formData, "telefone"),
    },
  });
  await prisma.atleta.update({
    where: { id: atletaId },
    data: {
      apelido: campo(formData, "apelido"),
      posicao: (campo(formData, "posicao") as Posicao) ?? undefined,
      posicaoFutsal: (campo(formData, "posicaoFutsal") as Posicao) ?? null,
      numeroCamisa: campo(formData, "numeroCamisa") ? Number(campo(formData, "numeroCamisa")) : null,
      nascimento: campo(formData, "nascimento") ? new Date(campo(formData, "nascimento")!) : null,
      peDominante: campo(formData, "peDominante"),
      tipoSanguineo: campo(formData, "tipoSanguineo"),
      convenio: campo(formData, "convenio"),
      contatoEmergenciaNome: campo(formData, "contatoEmergenciaNome"),
      contatoEmergenciaFone: campo(formData, "contatoEmergenciaFone"),
      observacoesSaude: campo(formData, "observacoesSaude"),
      isento: formData.get("isento") === "on",
    },
  });
  revalidatePath(`/atletas/${atletaId}`);
  redirect(`/atletas/${atletaId}`);
}

export async function alternarAtivoUsuario(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("usuarioId"));
  const u = await prisma.usuario.findUnique({ where: { id } });
  if (!u) return;
  await prisma.usuario.update({ where: { id }, data: { ativo: !u.ativo } });
  revalidatePath("/", "layout");
}

export async function redefinirSenha(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("usuarioId"));
  const senha = String(formData.get("senha") ?? "");
  if (senha.length < 4) return;
  await prisma.usuario.update({
    where: { id },
    data: { senhaHash: await bcrypt.hash(senha, 10) },
  });
  revalidatePath("/", "layout");
}
