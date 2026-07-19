import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { obterClube } from "@/server/clube-actions";
import { calcularRankings, retrospecto } from "@/server/stats";
import { fmtDataHora, fmtMoeda, competenciaAtual } from "@/lib/format";
import { Pagina, PageHeader, StatCard, Vazio } from "@/components/ui";
import { responderConvocacao } from "@/server/jogos-actions";

export default async function Dashboard() {
  const sessao = (await getSessao())!;
  const admin = sessao.role !== "ATLETA";
  const clube = await obterClube();

  const [proximos, ultimos, retro, rankings, avisos] = await Promise.all([
    prisma.jogo.findMany({
      where: { status: "AGENDADO", dataHora: { gte: new Date(Date.now() - 3 * 3600_000) } },
      orderBy: { dataHora: "asc" },
      take: 3,
      include: { adversario: true, local: true, kit: true, confirmacoes: true },
    }),
    prisma.jogo.findMany({
      where: { status: "ENCERRADO" },
      orderBy: { dataHora: "desc" },
      take: 3,
      include: { adversario: true },
    }),
    retrospecto(),
    calcularRankings(),
    prisma.aviso.findMany({ orderBy: [{ fixado: "desc" }, { criadoEm: "desc" }], take: 3 }),
  ]);

  const artilheiro = rankings[0]?.gols ? rankings[0] : null;
  const pendentes = admin && clube.mensalidadeAtiva
    ? await prisma.pagamento.count({
        where: { competencia: competenciaAtual(), status: { in: ["PENDENTE", "AGUARDANDO_CONFIRMACAO"] } },
      })
    : null;

  const minhaConfirmacao = (jogoId: string, confs: { atletaId: string; status: string }[]) =>
    confs.find((c) => c.atletaId === sessao.atletaId)?.status;

  return (
    <Pagina>
      <PageHeader
        titulo={`Fala, ${sessao.nome.split(" ")[0]}! 👋`}
        subtitulo={`${clube.nome} — temporada ${new Date().getFullYear()}`}
      />

      <div className={`grid grid-cols-2 ${clube.mensalidadeAtiva ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-3 mb-8`}>
        <StatCard rotulo="Jogos" valor={retro.jogos} detalhe={`${retro.vitorias}V · ${retro.empates}E · ${retro.derrotas}D`} />
        <StatCard rotulo="Saldo de gols" valor={retro.golsPro - retro.golsContra} detalhe={`${retro.golsPro} pró · ${retro.golsContra} contra`} cor={retro.golsPro - retro.golsContra >= 0 ? "text-success" : "text-danger"} />
        <StatCard rotulo="Artilheiro" valor={artilheiro ? `${artilheiro.gols} ⚽` : "—"} detalhe={artilheiro ? (artilheiro.apelido ?? artilheiro.nome) : "sem gols ainda"} />
        {clube.mensalidadeAtiva && (admin ? (
          <StatCard rotulo="Mensalidades em aberto" valor={pendentes ?? 0} detalhe={fmtMoeda(Number(clube.mensalidadeValor)) + "/mês"} cor={pendentes ? "text-accent" : "text-success"} />
        ) : (
          <StatCard rotulo="Mensalidade" valor={fmtMoeda(Number(clube.mensalidadeValor))} detalhe={`vence dia ${clube.mensalidadeVencimentoDia}`} />
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section>
          <h2 className="font-bold mb-3 flex items-center gap-2">📅 Próximos jogos</h2>
          {proximos.length === 0 && <Vazio mensagem="Nenhum jogo agendado." />}
          <div className="space-y-3">
            {proximos.map((j) => {
              const confirmados = j.confirmacoes.filter((c) => c.status === "CONFIRMADO").length;
              const minha = minhaConfirmacao(j.id, j.confirmacoes);
              return (
                <div key={j.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/jogos/${j.id}`} className="font-semibold hover:text-primary">
                        vs {j.adversario?.nome ?? "A definir"}
                      </Link>
                      <div className="text-sm text-muted">
                        {fmtDataHora(j.dataHora)} · {j.local?.nome ?? "local a definir"}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        {j.modalidade === "CAMPO" ? "⚽ Campo" : "🥅 Futsal"} · Kit: {j.kit.nome} ·{" "}
                        <span className={confirmados >= j.maxJogadores ? "text-accent" : "text-success"}>
                          {confirmados}/{j.maxJogadores} confirmados
                        </span>
                      </div>
                    </div>
                    {sessao.atletaId && (
                      <div className="flex gap-1.5 shrink-0">
                        <form action={responderConvocacao}>
                          <input type="hidden" name="jogoId" value={j.id} />
                          <input type="hidden" name="resposta" value="sim" />
                          <button className={`btn px-3 py-1.5 text-xs ${minha === "CONFIRMADO" || minha === "LISTA_ESPERA" ? "btn-primary" : "btn-outline"}`}>
                            {minha === "LISTA_ESPERA" ? "Na fila" : "Vou ✓"}
                          </button>
                        </form>
                        <form action={responderConvocacao}>
                          <input type="hidden" name="jogoId" value={j.id} />
                          <input type="hidden" name="resposta" value="nao" />
                          <button className={`btn px-3 py-1.5 text-xs ${minha === "RECUSADO" ? "btn-danger" : "btn-outline"}`}>
                            Não vou
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="font-bold mb-3 flex items-center gap-2">🏁 Últimos resultados</h2>
          {ultimos.length === 0 && <Vazio mensagem="Nenhum jogo encerrado ainda." />}
          <div className="space-y-3">
            {ultimos.map((j) => {
              const gp = j.golsPro ?? 0, gc = j.golsContra ?? 0;
              const cor = gp > gc ? "text-success" : gp === gc ? "text-accent" : "text-danger";
              return (
                <Link key={j.id} href={`/jogos/${j.id}`} className="card p-4 flex items-center justify-between hover:border-primary/40 transition-colors">
                  <div>
                    <div className="font-semibold">vs {j.adversario?.nome ?? "?"}</div>
                    <div className="text-xs text-muted">{fmtDataHora(j.dataHora)}</div>
                  </div>
                  <div className={`text-xl font-bold ${cor}`}>{gp} × {gc}</div>
                </Link>
              );
            })}
          </div>

          {avisos.length > 0 && (
            <div className="mt-6">
              <h2 className="font-bold mb-3 flex items-center gap-2">📢 Avisos</h2>
              <div className="space-y-2">
                {avisos.map((a) => (
                  <div key={a.id} className="card p-3">
                    <div className="font-semibold text-sm">{a.fixado && "📌 "}{a.titulo}</div>
                    <div className="text-xs text-muted line-clamp-2">{a.texto}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </Pagina>
  );
}
