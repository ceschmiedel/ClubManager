"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/auth";

export async function obterClube() {
  let clube = await prisma.clube.findFirst();
  if (!clube) {
    clube = await prisma.clube.create({
      data: { nome: "Amigos da Bola FC", apelido: "Amigos da Bola" },
    });
  }
  return clube;
}

export async function salvarClube(formData: FormData) {
  await exigirAdmin();
  const clube = await obterClube();
  const v = (k: string) => {
    const s = String(formData.get(k) ?? "").trim();
    return s === "" ? null : s;
  };
  await prisma.clube.update({
    where: { id: clube.id },
    data: {
      nome: v("nome") ?? clube.nome,
      apelido: v("apelido"),
      cidade: v("cidade"),
      estado: v("estado"),
      fundacao: v("fundacao") ? new Date(v("fundacao")!) : null,
      pixChave: v("pixChave"),
      pixTipoChave: v("pixTipoChave"),
      pixTitular: v("pixTitular"),
      pixBanco: v("pixBanco"),
      mensalidadeValor: v("mensalidadeValor") ? Number(v("mensalidadeValor")) : clube.mensalidadeValor,
      mensalidadeVencimentoDia: v("mensalidadeVencimentoDia") ? Number(v("mensalidadeVencimentoDia")) : clube.mensalidadeVencimentoDia,
      regulamento: v("regulamento"),
    },
  });
  revalidatePath("/", "layout");
}

// Identidade visual: cores do clube e escolha do tema
export async function salvarIdentidadeVisual(formData: FormData) {
  await exigirAdmin();
  const clube = await obterClube();
  const cor = (k: string) => {
    const s = String(formData.get(k) ?? "").trim();
    return /^#[0-9a-fA-F]{6}$/.test(s) ? s : undefined;
  };
  await prisma.clube.update({
    where: { id: clube.id },
    data: {
      corPrimaria: cor("corPrimaria"),
      corSecundaria: cor("corSecundaria"),
      usarCoresClube: String(formData.get("tema")) === "clube",
    },
  });
  revalidatePath("/", "layout");
}

export async function enviarEscudo(
  _prev: { erro?: string } | undefined,
  formData: FormData
) {
  await exigirAdmin();
  const arquivo = formData.get("escudo") as File | null;
  if (!arquivo || arquivo.size === 0) return { erro: "Selecione uma imagem" };
  if (arquivo.size > 1024 * 1024) return { erro: "Imagem muito grande (máx. 1MB)" };
  if (!arquivo.type.startsWith("image/")) return { erro: "O arquivo precisa ser uma imagem" };
  const clube = await obterClube();
  const buf = Buffer.from(await arquivo.arrayBuffer());
  await prisma.clube.update({
    where: { id: clube.id },
    data: { escudoUrl: `data:${arquivo.type};base64,${buf.toString("base64")}` },
  });
  revalidatePath("/", "layout");
  return {};
}

export async function removerEscudo() {
  await exigirAdmin();
  const clube = await obterClube();
  await prisma.clube.update({ where: { id: clube.id }, data: { escudoUrl: null } });
  revalidatePath("/", "layout");
}

// Gera (ou renova) o código de convite para auto-cadastro de atletas
export async function gerarCodigoConvite() {
  await exigirAdmin();
  const clube = await obterClube();
  const alfabeto = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "BOLA-";
  for (let i = 0; i < 5; i++)
    codigo += alfabeto[Math.floor(Math.random() * alfabeto.length)];
  await prisma.clube.update({ where: { id: clube.id }, data: { codigoConvite: codigo } });
  revalidatePath("/clube");
}

export async function desativarCodigoConvite() {
  await exigirAdmin();
  const clube = await obterClube();
  await prisma.clube.update({ where: { id: clube.id }, data: { codigoConvite: null } });
  revalidatePath("/clube");
}
