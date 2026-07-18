"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { Posicao } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/auth";

const SENHA_PADRAO = "amigos123";

const MAPA_POSICAO: Record<string, Posicao> = {
  goleiro: "GOLEIRO", zagueiro: "ZAGUEIRO", lateral: "LATERAL",
  volante: "VOLANTE", meia: "MEIA", atacante: "ATACANTE",
  fixo: "FIXO", ala: "ALA", pivo: "PIVO",
};

export type ResultadoImportacao = {
  erro?: string;
  criados?: string[];
  falhas?: { linha: number; motivo: string }[];
  senhaPadrao?: string;
};

function texto(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

function parseNascimento(v: unknown): Date | null {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  const s = texto(v);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return null;
}

export async function importarAtletas(
  _prev: ResultadoImportacao | undefined,
  formData: FormData
): Promise<ResultadoImportacao> {
  await exigirAdmin();
  const arquivo = formData.get("arquivo") as File | null;
  if (!arquivo || arquivo.size === 0) return { erro: "Selecione o arquivo .xlsx preenchido" };
  if (arquivo.size > 5 * 1024 * 1024) return { erro: "Arquivo muito grande (máx. 5MB)" };

  let linhas: unknown[][];
  try {
    const wb = XLSX.read(Buffer.from(await arquivo.arrayBuffer()), {
      type: "buffer",
      cellDates: true,
    });
    const ws = wb.Sheets[wb.SheetNames[0]];
    linhas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];
  } catch {
    return { erro: "Não consegui ler o arquivo. Use o template .xlsx baixado do sistema." };
  }

  if (linhas.length < 2) return { erro: "A planilha está vazia — preencha a partir da linha 2" };

  const criados: string[] = [];
  const falhas: { linha: number; motivo: string }[] = [];
  const emailsNaPlanilha = new Set<string>();
  let usouSenhaPadrao = false;

  for (let i = 1; i < linhas.length; i++) {
    const l = linhas[i];
    const numLinha = i + 1;
    const nome = texto(l[0]);
    const email = texto(l[1]).toLowerCase();
    if (!nome && !email) continue; // linha em branco

    if (!nome || !email) {
      falhas.push({ linha: numLinha, motivo: "Nome e Email são obrigatórios" });
      continue;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      falhas.push({ linha: numLinha, motivo: `E-mail inválido: ${email}` });
      continue;
    }
    if (emailsNaPlanilha.has(email)) {
      falhas.push({ linha: numLinha, motivo: `E-mail repetido na planilha: ${email}` });
      continue;
    }
    emailsNaPlanilha.add(email);
    if (await prisma.usuario.findUnique({ where: { email } })) {
      falhas.push({ linha: numLinha, motivo: `Já existe cadastro com ${email}` });
      continue;
    }

    const senhaInformada = texto(l[2]);
    if (senhaInformada && senhaInformada.length < 6) {
      falhas.push({ linha: numLinha, motivo: "Senha precisa ter no mínimo 6 caracteres" });
      continue;
    }
    if (!senhaInformada) usouSenhaPadrao = true;

    const posTexto = texto(l[4]).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const posicao = posTexto ? MAPA_POSICAO[posTexto] : "MEIA";
    if (posTexto && !posicao) {
      falhas.push({ linha: numLinha, motivo: `Posição desconhecida: ${texto(l[4])}` });
      continue;
    }

    const numeroCamisa = texto(l[5]) ? Number(texto(l[5])) : null;
    if (numeroCamisa !== null && (isNaN(numeroCamisa) || numeroCamisa < 1 || numeroCamisa > 99)) {
      falhas.push({ linha: numLinha, motivo: `Nº de camisa inválido: ${texto(l[5])}` });
      continue;
    }

    try {
      await prisma.usuario.create({
        data: {
          nome,
          email,
          senhaHash: await bcrypt.hash(senhaInformada || SENHA_PADRAO, 10),
          role: "ATLETA",
          telefone: texto(l[6]) || null,
          atleta: {
            create: {
              apelido: texto(l[3]) || null,
              posicao: posicao ?? "MEIA",
              numeroCamisa,
              nascimento: parseNascimento(l[7]),
              tipoSanguineo: texto(l[8]) || null,
              contatoEmergenciaNome: texto(l[9]) || null,
              contatoEmergenciaFone: texto(l[10]) || null,
            },
          },
        },
      });
      criados.push(nome);
    } catch {
      falhas.push({ linha: numLinha, motivo: `Erro ao salvar ${nome}` });
    }
  }

  revalidatePath("/atletas");
  return {
    criados,
    falhas,
    senhaPadrao: usouSenhaPadrao ? SENHA_PADRAO : undefined,
  };
}
