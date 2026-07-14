import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { retrospecto } from "@/server/stats";
import { fmtData } from "@/lib/format";
import { Pagina, PageHeader, StatCard, Vazio } from "@/components/ui";

export default async function HistoricoPage() {
  const [retro, jogos] = await Promise.all([
    retrospecto(),
    prisma.jogo.findMany({
      where: { status: "ENCERRADO" },
      orderBy: { dataHora: "desc" },
      include: { adversario: true, local: true, competicao: true },
    }),
  ]);

  // Retrospecto por adversário
  const porAdversario = new Map<string, { nome: string; j: number; v: number; e: number; d: number; gp: number; gc: number }>();
  for (const j of jogos) {
    const chave = j.adversario?.id ?? "sem";
    const r = porAdversario.get(chave) ?? { nome: j.adversario?.nome ?? "Sem adversário", j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0 };
    r.j++; r.gp += j.golsPro ?? 0; r.gc += j.golsContra ?? 0;
    if ((j.golsPro ?? 0) > (j.golsContra ?? 0)) r.v++;
    else if ((j.golsPro ?? 0) === (j.golsContra ?? 0)) r.e++;
    else r.d++;
    porAdversario.set(chave, r);
  }

  const aproveitamento = retro.jogos
    ? Math.round(((retro.vitorias * 3 + retro.empates) / (retro.jogos * 3)) * 100)
    : 0;

  return (
    <Pagina>
      <PageHeader titulo="Histórico" subtitulo="Retrospecto do clube" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        <StatCard rotulo="Jogos" valor={retro.jogos} />
        <StatCard rotulo="Vitórias" valor={retro.vitorias} cor="text-primary" />
        <StatCard rotulo="Empates" valor={retro.empates} cor="text-accent" />
        <StatCard rotulo="Derrotas" valor={retro.derrotas} cor="text-danger" />
        <StatCard rotulo="Aproveitamento" valor={`${aproveitamento}%`} />
      </div>

      <section className="mb-8">
        <h2 className="font-bold mb-3">🤝 Retrospecto por adversário</h2>
        {porAdversario.size === 0 ? (
          <Vazio mensagem="Sem confrontos registrados." />
        ) : (
          <div className="card overflow-x-auto">
            <table className="tabela">
              <thead><tr><th>Adversário</th><th>J</th><th>V</th><th>E</th><th>D</th><th>Gols</th></tr></thead>
              <tbody>
                {[...porAdversario.values()].sort((a, b) => b.j - a.j).map((r) => (
                  <tr key={r.nome}>
                    <td className="font-medium">{r.nome}</td>
                    <td>{r.j}</td>
                    <td className="text-primary font-semibold">{r.v}</td>
                    <td className="text-accent">{r.e}</td>
                    <td className="text-danger">{r.d}</td>
                    <td>{r.gp}×{r.gc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-bold mb-3">📜 Todos os resultados</h2>
        {jogos.length === 0 && <Vazio mensagem="Nenhum jogo encerrado." />}
        <div className="space-y-2">
          {jogos.map((j) => {
            const gp = j.golsPro ?? 0, gc = j.golsContra ?? 0;
            return (
              <Link key={j.id} href={`/jogos/${j.id}`} className="card p-3.5 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                <div className="min-w-0">
                  <span className="font-semibold">{j.emCasa ? "" : "@ "}vs {j.adversario?.nome ?? "?"}</span>
                  <span className="text-xs text-muted ml-2">
                    {fmtData(j.dataHora)} · {j.competicao?.nome ?? "Amistoso"} · {j.modalidade === "CAMPO" ? "Campo" : "Futsal"}
                  </span>
                </div>
                <div className={`font-bold shrink-0 ${gp > gc ? "text-primary" : gp === gc ? "text-accent" : "text-danger"}`}>
                  {gp} × {gc}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </Pagina>
  );
}
