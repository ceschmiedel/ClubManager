import { prisma } from "@/lib/prisma";

export type LinhaRanking = {
  atletaId: string;
  nome: string;
  apelido: string | null;
  numeroCamisa: number | null;
  jogos: number;
  gols: number;
  assistencias: number;
  amarelos: number;
  vermelhos: number;
  notaMedia: number | null;
  craques: number;
  golsSofridos: number;
  jogosSemSofrer: number;
};

export async function calcularRankings(): Promise<LinhaRanking[]> {
  const atletas = await prisma.atleta.findMany({
    where: { usuario: { ativo: true } },
    include: {
      usuario: true,
      participacoes: { where: { presente: true, jogo: { status: "ENCERRADO" } } },
      notasRecebidas: true,
      votosCraqueRecebidos: true,
    },
  });

  return atletas
    .map((a) => {
      const notas = a.notasRecebidas.map((n) => Number(n.nota));
      const comGolsSofridos = a.participacoes.filter((p) => p.golsSofridos !== null);
      return {
        atletaId: a.id,
        nome: a.usuario.nome,
        apelido: a.apelido,
        numeroCamisa: a.numeroCamisa,
        jogos: a.participacoes.length,
        gols: a.participacoes.reduce((s, p) => s + p.gols, 0),
        assistencias: a.participacoes.reduce((s, p) => s + p.assistencias, 0),
        amarelos: a.participacoes.reduce((s, p) => s + p.cartaoAmarelo, 0),
        vermelhos: a.participacoes.reduce((s, p) => s + p.cartaoVermelho, 0),
        notaMedia: notas.length
          ? Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 10) / 10
          : null,
        craques: a.votosCraqueRecebidos.length,
        golsSofridos: comGolsSofridos.reduce((s, p) => s + (p.golsSofridos ?? 0), 0),
        jogosSemSofrer: comGolsSofridos.filter((p) => p.golsSofridos === 0).length,
      };
    })
    .sort((x, y) => y.gols - x.gols);
}

export async function retrospecto() {
  const jogos = await prisma.jogo.findMany({
    where: { status: "ENCERRADO" },
    include: { adversario: true },
  });
  let v = 0, e = 0, d = 0, gp = 0, gc = 0;
  for (const j of jogos) {
    // Jogos sem placar informado ficam fora do V/E/D e dos gols
    if (j.golsPro === null || j.golsContra === null) continue;
    gp += j.golsPro;
    gc += j.golsContra;
    if (j.golsPro > j.golsContra) v++;
    else if (j.golsPro === j.golsContra) e++;
    else d++;
  }
  return { jogos: jogos.length, vitorias: v, empates: e, derrotas: d, golsPro: gp, golsContra: gc };
}

export async function craqueDoJogo(jogoId: string) {
  const votos = await prisma.votoCraque.findMany({
    where: { jogoId },
    include: { votado: { include: { usuario: true } } },
  });
  if (!votos.length) return null;
  const contagem = new Map<string, { nome: string; votos: number }>();
  for (const v of votos) {
    const atual = contagem.get(v.votadoId) ?? {
      nome: v.votado.apelido ?? v.votado.usuario.nome,
      votos: 0,
    };
    atual.votos++;
    contagem.set(v.votadoId, atual);
  }
  return [...contagem.entries()]
    .map(([atletaId, c]) => ({ atletaId, ...c }))
    .sort((a, b) => b.votos - a.votos)[0];
}
