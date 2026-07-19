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

// Ordem canônica: a primeira posição marcada vira a principal
const ORDEM_POSICOES: Posicao[] = [
  "GOLEIRO", "ZAGUEIRO", "LATERAL_DIREITO", "LATERAL_ESQUERDO",
  "VOLANTE", "MEIA", "ATACANTE",
];

function lerPosicoes(formData: FormData): { posicoes: Posicao[]; principal: Posicao } {
  const marcadas = formData
    .getAll("posicoes")
    .map(String)
    .filter((p): p is Posicao => (ORDEM_POSICOES as string[]).includes(p));
  const ordenadas = ORDEM_POSICOES.filter((p) => marcadas.includes(p));
  return { posicoes: ordenadas, principal: ordenadas[0] ?? "MEIA" };
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
      atleta: formData.get("tambemAtleta") === "on" ? { create: {} } : undefined,
    },
  });
  revalidatePath("/funcionarios");
  redirect("/funcionarios");
}

// Marca/desmarca um funcionário como atleta do clube
export async function alternarFuncionarioAtleta(
  _prev: { erro?: string; ok?: boolean } | undefined,
  formData: FormData
): Promise<{ erro?: string; ok?: boolean }> {
  const sessao = await exigirAdmin();
  const usuarioId = String(formData.get("usuarioId"));
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: {
      atleta: {
        include: {
          _count: {
            select: { participacoes: true, pagamentos: true, confirmacoes: true, notasRecebidas: true },
          },
        },
      },
    },
  });
  if (!usuario || usuario.role === "ATLETA") return { erro: "Usuário inválido" };

  if (!usuario.atleta) {
    await prisma.atleta.create({ data: { usuarioId } });
  } else {
    const c = usuario.atleta._count;
    if (c.participacoes || c.pagamentos || c.confirmacoes || c.notasRecebidas) {
      return {
        erro: "Este funcionário já tem histórico como atleta (jogos, presenças ou mensalidades). Para preservar os dados, desative o usuário em vez de remover o vínculo.",
      };
    }
    await prisma.atleta.delete({ where: { id: usuario.atleta.id } });
  }

  // Se o admin alterou a própria conta, renova a sessão para valer na hora
  if (usuarioId === sessao.sub) {
    const atualizado = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { atleta: true },
    });
    const { criarSessao } = await import("@/lib/auth");
    await criarSessao({
      sub: usuarioId,
      nome: atualizado!.nome,
      role: atualizado!.role,
      atletaId: atualizado!.atleta?.id,
    });
  }
  revalidatePath("/", "layout");
  return { ok: true };
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
          posicao: lerPosicoes(formData).principal,
          posicoes: lerPosicoes(formData).posicoes,
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
  const { posicoes, principal } = lerPosicoes(formData);
  await prisma.atleta.update({
    where: { id: atletaId },
    data: {
      apelido: campo(formData, "apelido"),
      posicao: principal,
      posicoes,
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
