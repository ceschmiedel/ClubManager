"use server";

import { revalidatePath } from "next/cache";
import { TipoKit } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/auth";

function campo(fd: FormData, k: string) {
  const s = String(fd.get(k) ?? "").trim();
  return s === "" ? null : s;
}

export async function salvarKit(
  _prev: { erro?: string } | undefined,
  formData: FormData
) {
  await exigirAdmin();
  const id = campo(formData, "kitId");
  const nome = campo(formData, "nome");
  const corPrimaria = campo(formData, "corPrimaria");
  if (!nome || !corPrimaria) return { erro: "Informe nome e cor principal" };
  const data = {
    nome,
    tipo: (campo(formData, "tipo") as TipoKit) ?? "TITULAR",
    corPrimaria,
    corSecundaria: campo(formData, "corSecundaria"),
    corCalcao: campo(formData, "corCalcao"),
    corMeiao: campo(formData, "corMeiao"),
    fornecedor: campo(formData, "fornecedor"),
    ano: campo(formData, "ano") ? Number(campo(formData, "ano")) : null,
    observacoes: campo(formData, "observacoes"),
  };
  if (id) await prisma.kit.update({ where: { id }, data });
  else await prisma.kit.create({ data });
  revalidatePath("/uniformes");
  return {};
}

export async function alternarAtivoKit(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("kitId"));
  const kit = await prisma.kit.findUnique({ where: { id } });
  if (!kit) return;
  await prisma.kit.update({ where: { id }, data: { ativo: !kit.ativo } });
  revalidatePath("/uniformes");
}

export async function salvarPecaKit(formData: FormData) {
  await exigirAdmin();
  const kitId = String(formData.get("kitId"));
  const tamanho = String(formData.get("tamanho") ?? "").trim().toUpperCase();
  const quantidade = Number(formData.get("quantidade") ?? 0);
  if (!tamanho) return;
  const existente = await prisma.pecaKit.findFirst({ where: { kitId, tamanho } });
  if (existente) {
    await prisma.pecaKit.update({ where: { id: existente.id }, data: { quantidade } });
  } else {
    await prisma.pecaKit.create({ data: { kitId, tamanho, quantidade } });
  }
  revalidatePath("/uniformes");
}

export async function excluirPecaKit(formData: FormData) {
  await exigirAdmin();
  await prisma.pecaKit.delete({ where: { id: String(formData.get("pecaId")) } });
  revalidatePath("/uniformes");
}
