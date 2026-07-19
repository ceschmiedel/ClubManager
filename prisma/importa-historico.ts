// Importa o histórico real de jogos do Amigos da Bola FC.
// Idempotente: roda quantas vezes precisar sem duplicar.
// Uso: DATABASE_URL="<url>" npx tsx prisma/importa-historico.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type JogoHistorico = {
  data: string; // ISO
  adversario: string;
  local: string;
  gp?: number;
  gc?: number;
  obs?: string;
};

const JOGOS: JogoHistorico[] = [
  { data: "2026-07-15", adversario: "Master 45 Ibaté", local: "Estádio Municipal de Ibaté", gp: 2, gc: 2 },
  { data: "2026-07-12", adversario: "A.A.D.C. Delta", local: "Estádio dos Eucaliptos", gp: 4, gc: 2 },
  { data: "2026-07-05", adversario: "Red Bull Master Itirapina", local: "Futebol Solidário" },
  { data: "2026-06-28", adversario: "Master São Carlos", local: "Estádio de Analândia" },
  { data: "2026-06-14", adversario: "Corumbataí Master 38+", local: "Estádio dos Eucaliptos" },
  { data: "2026-06-07", adversario: "A.A. Analandense Master 38+", local: "Estádio dos Eucaliptos" },
  { data: "2026-05-24", adversario: "Lusa", local: "Clube de Campo das Figueiras, Porto Ferreira" },
  { data: "2026-05-17", adversario: "Master Paulistano (Limeira)", local: "Estádio do Paulistano" },
  { data: "2026-04-26", adversario: "Resenha Futebol Clube (São Pedro)", local: "São Pedrão" },
  { data: "2026-04-12", adversario: "Corumbataí Master 38+", local: "Estádio Municipal de Ferraz" },
  { data: "2026-03-29", adversario: "Family Federal", local: "Campo Ratti" },
  { data: "2026-03-22", adversario: "Red Bull Master Itirapina", local: "Estádio de Analândia", gp: 2, gc: 1 },
  { data: "2026-03-01", adversario: "Corumbataí Master 38+", local: "Estádio Municipal de Ferraz", gp: 4, gc: 1 },
  { data: "2026-01-25", adversario: "Red Bull Master Itirapina", local: "Estádio dos Eucaliptos" },
  { data: "2026-01-18", adversario: "CERD", local: "Campo CERD", obs: "Data aproximada — jogo realizado em janeiro" },
  { data: "2026-01-11", adversario: "Estrela Monte Carlo (Rio Claro)", local: "Estádio dos Eucaliptos" },
];

const CASA = ["Eucaliptos", "Analândia"];

async function main() {
  // Kit é obrigatório em todo jogo: usa o primeiro ativo ou cria um padrão
  let kit = await prisma.kit.findFirst({ where: { ativo: true } });
  if (!kit) {
    kit = await prisma.kit.create({
      data: { nome: "Titular", tipo: "TITULAR", corPrimaria: "#16a34a", corSecundaria: "#ffffff" },
    });
    console.log("Kit padrão criado (edite em /uniformes)");
  }

  const adversarios = new Map<string, string>();
  const locais = new Map<string, string>();
  let criados = 0, pulados = 0;

  for (const j of JOGOS) {
    let advId = adversarios.get(j.adversario);
    if (!advId) {
      const adv =
        (await prisma.adversario.findFirst({ where: { nome: j.adversario } })) ??
        (await prisma.adversario.create({ data: { nome: j.adversario } }));
      advId = adv.id;
      adversarios.set(j.adversario, advId);
    }

    let localId = locais.get(j.local);
    if (!localId) {
      const loc =
        (await prisma.local.findFirst({ where: { nome: j.local } })) ??
        (await prisma.local.create({ data: { nome: j.local, modalidade: "CAMPO" } }));
      localId = loc.id;
      locais.set(j.local, localId);
    }

    const dataHora = new Date(`${j.data}T09:00:00-03:00`);
    const inicioDia = new Date(`${j.data}T00:00:00-03:00`);
    const fimDia = new Date(`${j.data}T23:59:59-03:00`);
    const existente = await prisma.jogo.findFirst({
      where: { adversarioId: advId, dataHora: { gte: inicioDia, lte: fimDia } },
    });
    if (existente) {
      pulados++;
      continue;
    }

    await prisma.jogo.create({
      data: {
        dataHora,
        modalidade: "CAMPO",
        status: "ENCERRADO",
        adversarioId: advId,
        localId,
        kitId: kit.id,
        emCasa: CASA.some((c) => j.local.includes(c)),
        golsPro: j.gp ?? null,
        golsContra: j.gc ?? null,
        encerradoEm: dataHora,
        observacoes: j.obs ?? null,
      },
    });
    criados++;
  }

  console.log(`Histórico importado: ${criados} jogo(s) criado(s), ${pulados} já existiam.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
