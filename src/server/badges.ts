import { prisma } from "@/lib/prisma";

const NIVEIS_JOGOS = [10, 25, 50, 100];
const NIVEIS_GOLS = [10, 25, 50];

// Recalcula conquistas de todos os atletas a partir do histórico.
export async function recalcularBadges() {
  const atletas = await prisma.atleta.findMany({
    include: {
      participacoes: { where: { presente: true, jogo: { status: "ENCERRADO" } }, include: { jogo: true } },
      votosCraqueRecebidos: true,
    },
  });

  for (const a of atletas) {
    const jogos = a.participacoes.length;
    const gols = a.participacoes.reduce((s, p) => s + p.gols, 0);
    const craques = a.votosCraqueRecebidos.length;
    const jogosSemSofrer = a.participacoes.filter(
      (p) => p.golsSofridos === 0
    ).length;

    const desejados: { codigo: string; rotulo: string }[] = [];
    for (const n of NIVEIS_JOGOS)
      if (jogos >= n) desejados.push({ codigo: `JOGOS_${n}`, rotulo: `${n} jogos disputados` });
    for (const n of NIVEIS_GOLS)
      if (gols >= n) desejados.push({ codigo: `GOLS_${n}`, rotulo: `${n} gols marcados` });
    if (craques >= 3)
      desejados.push({ codigo: "CRAQUE_3", rotulo: "3+ votos de craque da partida" });
    if (jogosSemSofrer >= 3)
      desejados.push({ codigo: "PAREDAO", rotulo: "Paredão: 3 jogos sem sofrer gol" });

    for (const b of desejados) {
      await prisma.badgeAtleta.upsert({
        where: { atletaId_codigo: { atletaId: a.id, codigo: b.codigo } },
        update: {},
        create: { atletaId: a.id, codigo: b.codigo, rotulo: b.rotulo },
      });
    }
  }
}
