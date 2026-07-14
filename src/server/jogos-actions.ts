"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Modalidade } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirAdmin, exigirSessao } from "@/lib/auth";
import { recalcularBadges } from "./badges";

function campo(fd: FormData, k: string) {
  const s = String(fd.get(k) ?? "").trim();
  return s === "" ? null : s;
}

export async function criarJogo(
  _prev: { erro?: string } | undefined,
  formData: FormData
) {
  await exigirAdmin();
  const dataHora = campo(formData, "dataHora");
  const kitId = campo(formData, "kitId");
  if (!dataHora) return { erro: "Informe data e hora do jogo" };
  if (!kitId) return { erro: "Todo jogo precisa de um kit de uniforme escolhido" };
  const jogo = await prisma.jogo.create({
    data: {
      dataHora: new Date(dataHora),
      modalidade: (campo(formData, "modalidade") as Modalidade) ?? "CAMPO",
      adversarioId: campo(formData, "adversarioId"),
      localId: campo(formData, "localId"),
      competicaoId: campo(formData, "competicaoId"),
      kitId,
      maxJogadores: Number(campo(formData, "maxJogadores") ?? 22),
      emCasa: formData.get("emCasa") === "on",
      observacoes: campo(formData, "observacoes"),
    },
  });
  revalidatePath("/jogos");
  redirect(`/jogos/${jogo.id}`);
}

export async function editarJogo(
  _prev: { erro?: string } | undefined,
  formData: FormData
) {
  await exigirAdmin();
  const id = String(formData.get("jogoId"));
  const kitId = campo(formData, "kitId");
  if (!kitId) return { erro: "Todo jogo precisa de um kit de uniforme escolhido" };
  await prisma.jogo.update({
    where: { id },
    data: {
      dataHora: campo(formData, "dataHora") ? new Date(campo(formData, "dataHora")!) : undefined,
      modalidade: (campo(formData, "modalidade") as Modalidade) ?? undefined,
      adversarioId: campo(formData, "adversarioId"),
      localId: campo(formData, "localId"),
      competicaoId: campo(formData, "competicaoId"),
      kitId,
      maxJogadores: Number(campo(formData, "maxJogadores") ?? 22),
      emCasa: formData.get("emCasa") === "on",
      observacoes: campo(formData, "observacoes"),
    },
  });
  revalidatePath(`/jogos/${id}`);
  redirect(`/jogos/${id}`);
}

export async function cancelarJogo(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("jogoId"));
  await prisma.jogo.update({ where: { id }, data: { status: "CANCELADO" } });
  revalidatePath("/jogos");
}

// Confirmação de presença com lista de espera
export async function responderConvocacao(formData: FormData) {
  const sessao = await exigirSessao();
  const jogoId = String(formData.get("jogoId"));
  const resposta = String(formData.get("resposta")); // "sim" | "nao"
  const atletaId =
    (formData.get("atletaId") && (sessao.role !== "ATLETA")
      ? String(formData.get("atletaId"))
      : sessao.atletaId) ?? null;
  if (!atletaId) return;

  const jogo = await prisma.jogo.findUnique({
    where: { id: jogoId },
    include: { confirmacoes: true },
  });
  if (!jogo || jogo.status !== "AGENDADO") return;

  if (resposta === "nao") {
    await prisma.confirmacao.upsert({
      where: { jogoId_atletaId: { jogoId, atletaId } },
      update: { status: "RECUSADO" },
      create: { jogoId, atletaId, status: "RECUSADO" },
    });
    await promoverListaEspera(jogoId);
  } else {
    const confirmados = jogo.confirmacoes.filter(
      (c) => c.status === "CONFIRMADO" && c.atletaId !== atletaId
    ).length;
    const status = confirmados < jogo.maxJogadores ? "CONFIRMADO" : "LISTA_ESPERA";
    await prisma.confirmacao.upsert({
      where: { jogoId_atletaId: { jogoId, atletaId } },
      update: { status, criadoEm: new Date() },
      create: { jogoId, atletaId, status },
    });
  }
  revalidatePath(`/jogos/${jogoId}`);
}

async function promoverListaEspera(jogoId: string) {
  const jogo = await prisma.jogo.findUnique({
    where: { id: jogoId },
    include: { confirmacoes: { orderBy: { criadoEm: "asc" } } },
  });
  if (!jogo) return;
  const confirmados = jogo.confirmacoes.filter((c) => c.status === "CONFIRMADO").length;
  const vagas = jogo.maxJogadores - confirmados;
  if (vagas <= 0) return;
  const fila = jogo.confirmacoes.filter((c) => c.status === "LISTA_ESPERA").slice(0, vagas);
  for (const c of fila) {
    await prisma.confirmacao.update({ where: { id: c.id }, data: { status: "CONFIRMADO" } });
  }
}

// Resultado + estatísticas individuais
export async function registrarResultado(formData: FormData) {
  await exigirAdmin();
  const jogoId = String(formData.get("jogoId"));
  const golsPro = Number(formData.get("golsPro") ?? 0);
  const golsContra = Number(formData.get("golsContra") ?? 0);

  const atletaIds = formData.getAll("atletaId").map(String);
  await prisma.jogo.update({
    where: { id: jogoId },
    data: { golsPro, golsContra, status: "ENCERRADO", encerradoEm: new Date() },
  });

  for (const atletaId of atletaIds) {
    const presente = formData.get(`presente_${atletaId}`) === "on";
    const n = (k: string) => Number(formData.get(`${k}_${atletaId}`) ?? 0) || 0;
    await prisma.participacao.upsert({
      where: { jogoId_atletaId: { jogoId, atletaId } },
      update: {
        presente,
        gols: n("gols"),
        assistencias: n("assistencias"),
        cartaoAmarelo: n("amarelo"),
        cartaoVermelho: n("vermelho"),
        golsSofridos: formData.get(`sofridos_${atletaId}`) !== null && String(formData.get(`sofridos_${atletaId}`)) !== "" ? n("sofridos") : null,
      },
      create: {
        jogoId,
        atletaId,
        presente,
        gols: n("gols"),
        assistencias: n("assistencias"),
        cartaoAmarelo: n("amarelo"),
        cartaoVermelho: n("vermelho"),
        golsSofridos: formData.get(`sofridos_${atletaId}`) !== null && String(formData.get(`sofridos_${atletaId}`)) !== "" ? n("sofridos") : null,
      },
    });
  }
  await recalcularBadges();
  revalidatePath(`/jogos/${jogoId}`);
  revalidatePath("/historico");
}

export async function reabrirJogo(formData: FormData) {
  await exigirAdmin();
  const jogoId = String(formData.get("jogoId"));
  await prisma.jogo.update({
    where: { id: jogoId },
    data: { status: "AGENDADO", encerradoEm: null },
  });
  revalidatePath(`/jogos/${jogoId}`);
}

// Notas dos jogadores (atletas avaliam os companheiros)
export async function darNotas(formData: FormData) {
  const sessao = await exigirSessao();
  if (!sessao.atletaId) return;
  const jogoId = String(formData.get("jogoId"));
  const jogo = await prisma.jogo.findUnique({ where: { id: jogoId } });
  if (!jogo || jogo.status !== "ENCERRADO") return;

  const avaliadoIds = formData.getAll("avaliadoId").map(String);
  for (const avaliadoId of avaliadoIds) {
    const raw = String(formData.get(`nota_${avaliadoId}`) ?? "").replace(",", ".");
    if (raw === "") continue;
    const nota = Math.max(0, Math.min(10, Number(raw)));
    if (Number.isNaN(nota)) continue;
    await prisma.notaJogador.upsert({
      where: {
        jogoId_avaliadoId_avaliadorId: {
          jogoId,
          avaliadoId,
          avaliadorId: sessao.atletaId,
        },
      },
      update: { nota },
      create: { jogoId, avaliadoId, avaliadorId: sessao.atletaId, nota },
    });
  }
  revalidatePath(`/jogos/${jogoId}`);
}

// Craque da partida
export async function votarCraque(formData: FormData) {
  const sessao = await exigirSessao();
  if (!sessao.atletaId) return;
  const jogoId = String(formData.get("jogoId"));
  const votadoId = String(formData.get("votadoId"));
  if (!votadoId || votadoId === sessao.atletaId) return;
  const jogo = await prisma.jogo.findUnique({ where: { id: jogoId } });
  if (!jogo || jogo.status !== "ENCERRADO") return;
  await prisma.votoCraque.upsert({
    where: { jogoId_votanteId: { jogoId, votanteId: sessao.atletaId } },
    update: { votadoId },
    create: { jogoId, votanteId: sessao.atletaId, votadoId },
  });
  await recalcularBadges();
  revalidatePath(`/jogos/${jogoId}`);
}

// Mural do jogo
export async function comentarJogo(formData: FormData) {
  const sessao = await exigirSessao();
  const jogoId = String(formData.get("jogoId"));
  const texto = String(formData.get("texto") ?? "").trim();
  if (!texto) return;
  await prisma.comentarioJogo.create({
    data: { jogoId, autorId: sessao.sub, texto },
  });
  revalidatePath(`/jogos/${jogoId}`);
}
