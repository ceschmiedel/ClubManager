"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/auth";

export type PosicaoInput = { atletaId: string; x: number; y: number; titular: boolean };

export async function salvarFormacao(input: {
  jogoId: string;
  esquema?: string;
  anotacoes?: string;
  posicoes: PosicaoInput[];
}) {
  await exigirAdmin();
  const formacao = await prisma.formacao.upsert({
    where: { jogoId: input.jogoId },
    update: { esquema: input.esquema ?? null, anotacoes: input.anotacoes ?? null },
    create: {
      jogoId: input.jogoId,
      esquema: input.esquema ?? null,
      anotacoes: input.anotacoes ?? null,
    },
  });
  await prisma.posicaoTatica.deleteMany({ where: { formacaoId: formacao.id } });
  if (input.posicoes.length) {
    await prisma.posicaoTatica.createMany({
      data: input.posicoes.map((p) => ({
        formacaoId: formacao.id,
        atletaId: p.atletaId,
        x: Math.max(0, Math.min(100, p.x)),
        y: Math.max(0, Math.min(100, p.y)),
        titular: p.titular,
      })),
    });
  }
  revalidatePath(`/jogos/${input.jogoId}`);
  return { ok: true };
}
