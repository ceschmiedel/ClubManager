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
