"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/auth";

// Salva o fundo escolhido para o banner do jogo
export async function salvarBannerFundo(formData: FormData) {
  await exigirAdmin();
  const jogoId = String(formData.get("jogoId"));
  const fundo = String(formData.get("bannerFundo") ?? "").trim() || null;
  await prisma.jogo.update({ where: { id: jogoId }, data: { bannerFundo: fundo } });
  revalidatePath(`/jogos/${jogoId}`);
}

// Upload do escudo do adversário (data URL); afeta todos os jogos contra ele
export async function enviarEscudoAdversario(
  _prev: { erro?: string } | undefined,
  formData: FormData
): Promise<{ erro?: string }> {
  await exigirAdmin();
  const adversarioId = String(formData.get("adversarioId"));
  const arquivo = formData.get("escudo") as File | null;
  if (!adversarioId) return { erro: "Adversário não informado" };
  if (!arquivo || arquivo.size === 0) return { erro: "Selecione uma imagem" };
  if (arquivo.size > 1024 * 1024) return { erro: "Imagem muito grande (máx. 1MB)" };
  if (!arquivo.type.startsWith("image/")) return { erro: "O arquivo precisa ser uma imagem" };
  const buf = Buffer.from(await arquivo.arrayBuffer());
  await prisma.adversario.update({
    where: { id: adversarioId },
    data: { escudoUrl: `data:${arquivo.type};base64,${buf.toString("base64")}` },
  });
  revalidatePath("/", "layout");
  return {};
}

export async function removerEscudoAdversario(formData: FormData) {
  await exigirAdmin();
  const adversarioId = String(formData.get("adversarioId"));
  const jogoId = String(formData.get("jogoId") ?? "");
  await prisma.adversario.update({ where: { id: adversarioId }, data: { escudoUrl: null } });
  if (jogoId) revalidatePath(`/jogos/${jogoId}`);
}
