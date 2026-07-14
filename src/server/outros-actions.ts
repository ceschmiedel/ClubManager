"use server";

import { revalidatePath } from "next/cache";
import { Modalidade } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirAdmin, exigirSessao } from "@/lib/auth";

function campo(fd: FormData, k: string) {
  const s = String(fd.get(k) ?? "").trim();
  return s === "" ? null : s;
}

// ---------- Adversários e locais ----------
export async function criarAdversario(formData: FormData) {
  await exigirAdmin();
  const nome = campo(formData, "nome");
  if (!nome) return;
  await prisma.adversario.create({
    data: {
      nome,
      corCamisa: campo(formData, "corCamisa"),
      cidade: campo(formData, "cidade"),
      contato: campo(formData, "contato"),
    },
  });
  revalidatePath("/", "layout");
}

export async function criarLocal(formData: FormData) {
  await exigirAdmin();
  const nome = campo(formData, "nome");
  if (!nome) return;
  await prisma.local.create({
    data: {
      nome,
      endereco: campo(formData, "endereco"),
      modalidade: (campo(formData, "modalidade") as Modalidade) ?? "CAMPO",
      valorAluguel: campo(formData, "valorAluguel") ? Number(campo(formData, "valorAluguel")) : null,
    },
  });
  revalidatePath("/", "layout");
}

// ---------- Competições ----------
export async function criarCompeticao(formData: FormData) {
  await exigirAdmin();
  const nome = campo(formData, "nome");
  if (!nome) return;
  await prisma.competicao.create({
    data: {
      nome,
      temporada: campo(formData, "temporada"),
      descricao: campo(formData, "descricao"),
    },
  });
  revalidatePath("/competicoes");
}

// ---------- Lesões ----------
export async function registrarLesao(formData: FormData) {
  await exigirAdmin();
  const atletaId = campo(formData, "atletaId");
  const descricao = campo(formData, "descricao");
  if (!atletaId || !descricao) return;
  await prisma.lesao.create({
    data: {
      atletaId,
      descricao,
      dataInicio: campo(formData, "dataInicio") ? new Date(campo(formData, "dataInicio")!) : new Date(),
    },
  });
  revalidatePath("/saude");
}

export async function encerrarLesao(formData: FormData) {
  await exigirAdmin();
  await prisma.lesao.update({
    where: { id: String(formData.get("lesaoId")) },
    data: { ativa: false, dataRetorno: new Date() },
  });
  revalidatePath("/saude");
}

// ---------- Patrimônio ----------
export async function criarPatrimonio(formData: FormData) {
  await exigirAdmin();
  const nome = campo(formData, "nome");
  if (!nome) return;
  await prisma.patrimonio.create({
    data: {
      nome,
      categoria: campo(formData, "categoria") ?? "outros",
      quantidade: Number(campo(formData, "quantidade") ?? 1),
      observacoes: campo(formData, "observacoes"),
    },
  });
  revalidatePath("/patrimonio");
}

export async function registrarEmprestimo(formData: FormData) {
  await exigirAdmin();
  const patrimonioId = campo(formData, "patrimonioId");
  const atletaId = campo(formData, "atletaId");
  if (!patrimonioId || !atletaId) return;
  await prisma.emprestimoPatrimonio.create({
    data: {
      patrimonioId,
      atletaId,
      quantidade: Number(campo(formData, "quantidade") ?? 1),
    },
  });
  revalidatePath("/patrimonio");
}

export async function devolverEmprestimo(formData: FormData) {
  await exigirAdmin();
  await prisma.emprestimoPatrimonio.update({
    where: { id: String(formData.get("emprestimoId")) },
    data: { devolvidoEm: new Date() },
  });
  revalidatePath("/patrimonio");
}

// ---------- Avisos ----------
export async function criarAviso(formData: FormData) {
  const sessao = await exigirAdmin();
  const titulo = campo(formData, "titulo");
  const texto = campo(formData, "texto");
  if (!titulo || !texto) return;
  await prisma.aviso.create({
    data: {
      titulo,
      texto,
      autorId: sessao.sub,
      fixado: formData.get("fixado") === "on",
    },
  });
  revalidatePath("/avisos");
}

export async function excluirAviso(formData: FormData) {
  await exigirAdmin();
  await prisma.aviso.delete({ where: { id: String(formData.get("avisoId")) } });
  revalidatePath("/avisos");
}

// ---------- Galeria (fotos como data URL) ----------
export async function enviarFoto(
  _prev: { erro?: string } | undefined,
  formData: FormData
) {
  await exigirSessao();
  const arquivo = formData.get("arquivo") as File | null;
  if (!arquivo || arquivo.size === 0) return { erro: "Selecione uma imagem" };
  if (arquivo.size > 2 * 1024 * 1024) return { erro: "Imagem muito grande (máx. 2MB)" };
  if (!arquivo.type.startsWith("image/")) return { erro: "Arquivo precisa ser uma imagem" };
  const buf = Buffer.from(await arquivo.arrayBuffer());
  const url = `data:${arquivo.type};base64,${buf.toString("base64")}`;
  await prisma.foto.create({
    data: {
      url,
      legenda: campo(formData, "legenda"),
      jogoId: campo(formData, "jogoId"),
    },
  });
  revalidatePath("/galeria");
  return {};
}

export async function excluirFoto(formData: FormData) {
  await exigirAdmin();
  await prisma.foto.delete({ where: { id: String(formData.get("fotoId")) } });
  revalidatePath("/galeria");
}
