"use server";

import { revalidatePath } from "next/cache";
import { TipoLancamento } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirAdmin, exigirSessao } from "@/lib/auth";
import { obterClube } from "./clube-actions";

// Gera cobranças de mensalidade para todos os atletas ativos na competência
export async function gerarMensalidades(formData: FormData) {
  await exigirAdmin();
  const competencia = String(formData.get("competencia"));
  if (!/^\d{4}-\d{2}$/.test(competencia)) return;
  const clube = await obterClube();
  const atletas = await prisma.atleta.findMany({
    where: { usuario: { ativo: true } },
  });
  for (const a of atletas) {
    await prisma.pagamento.upsert({
      where: { atletaId_competencia: { atletaId: a.id, competencia } },
      update: {},
      create: {
        atletaId: a.id,
        competencia,
        valor: clube.mensalidadeValor,
        status: a.isento ? "ISENTO" : "PENDENTE",
      },
    });
  }
  revalidatePath("/financeiro");
}

// Atleta informa que pagou (aguardando confirmação do admin)
export async function informarPagamento(formData: FormData) {
  const sessao = await exigirSessao();
  if (!sessao.atletaId) return;
  const id = String(formData.get("pagamentoId"));
  const p = await prisma.pagamento.findUnique({ where: { id } });
  if (!p || p.atletaId !== sessao.atletaId || p.status === "PAGO") return;
  await prisma.pagamento.update({
    where: { id },
    data: {
      status: "AGUARDANDO_CONFIRMACAO",
      comprovanteInfo: String(formData.get("comprovanteInfo") ?? "").trim() || null,
    },
  });
  revalidatePath("/mensalidade");
  revalidatePath("/financeiro");
}

export async function confirmarPagamento(formData: FormData) {
  const sessao = await exigirAdmin();
  const id = String(formData.get("pagamentoId"));
  const p = await prisma.pagamento.findUnique({
    where: { id },
    include: { atleta: { include: { usuario: true } } },
  });
  if (!p) return;
  await prisma.pagamento.update({
    where: { id },
    data: { status: "PAGO", pagoEm: new Date(), confirmadoPor: sessao.nome },
  });
  await prisma.lancamento.create({
    data: {
      tipo: "RECEITA",
      categoria: "mensalidade",
      descricao: `Mensalidade ${p.competencia} — ${p.atleta.usuario.nome}`,
      valor: p.valor,
    },
  });
  revalidatePath("/financeiro");
  revalidatePath("/mensalidade");
}

export async function estornarPagamento(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("pagamentoId"));
  await prisma.pagamento.update({
    where: { id },
    data: { status: "PENDENTE", pagoEm: null, confirmadoPor: null },
  });
  revalidatePath("/financeiro");
}

export async function criarLancamento(formData: FormData) {
  await exigirAdmin();
  const valor = Number(String(formData.get("valor") ?? "").replace(",", "."));
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!descricao || !valor || Number.isNaN(valor)) return;
  await prisma.lancamento.create({
    data: {
      tipo: String(formData.get("tipo")) as TipoLancamento,
      categoria: String(formData.get("categoria") ?? "outros"),
      descricao,
      valor,
      data: formData.get("data") ? new Date(String(formData.get("data"))) : new Date(),
    },
  });
  revalidatePath("/financeiro");
}

export async function excluirLancamento(formData: FormData) {
  await exigirAdmin();
  await prisma.lancamento.delete({
    where: { id: String(formData.get("lancamentoId")) },
  });
  revalidatePath("/financeiro");
}
