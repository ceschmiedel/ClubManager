import { calcularRankings } from "@/server/stats";
import { prisma } from "@/lib/prisma";
import { Pagina, PageHeader, Vazio } from "@/components/ui";

export default async function RankingsPage() {
  const [linhas, totalJogos] = await Promise.all([
    calcularRankings(),
    prisma.jogo.count({ where: { status: "ENCERRADO" } }),
  ]);
  const comJogos = linhas.filter((l) => l.jogos > 0);

  const Tabela = ({
    titulo, icone, dados, colunas,
  }: {
    titulo: string;
    icone: string;
    dados: { chave: string; nome: string; valor: string | number; extra?: string }[];
    colunas: [string, string];
  }) => (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-borda font-bold">{icone} {titulo}</div>
      {dados.length === 0 ? (
        <div className="p-4 text-sm text-muted">Sem dados ainda.</div>
      ) : (
        <table className="tabela">
          <thead><tr><th>#</th><th>{colunas[0]}</th><th className="text-right pr-4">{colunas[1]}</th></tr></thead>
          <tbody>
            {dados.slice(0, 10).map((d, i) => (
              <tr key={d.chave}>
                <td className={`w-8 font-bold ${i === 0 ? "text-accent" : "text-muted"}`}>
                  {i === 0 ? "🏆" : i + 1}
                </td>
                <td className="font-medium">{d.nome}{d.extra && <span className="text-muted text-xs"> · {d.extra}</span>}</td>
                <td className="text-right pr-4 font-bold">{d.valor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const nome = (l: (typeof linhas)[number]) => l.apelido ?? l.nome;

  return (
    <Pagina>
      <PageHeader titulo="Rankings" subtitulo={`Estatísticas da temporada · ${totalJogos} jogos encerrados`} />
      {comJogos.length === 0 && <Vazio mensagem="Os rankings aparecem depois do primeiro jogo com resultado registrado." />}
      <div className="grid md:grid-cols-2 gap-4">
        <Tabela
          titulo="Artilheiros" icone="⚽" colunas={["Jogador", "Gols"]}
          dados={comJogos.filter((l) => l.gols > 0).sort((a, b) => b.gols - a.gols)
            .map((l) => ({ chave: l.atletaId, nome: nome(l), valor: l.gols, extra: `${l.jogos}j` }))}
        />
        <Tabela
          titulo="Garçons (assistências)" icone="👟" colunas={["Jogador", "Assist."]}
          dados={comJogos.filter((l) => l.assistencias > 0).sort((a, b) => b.assistencias - a.assistencias)
            .map((l) => ({ chave: l.atletaId, nome: nome(l), valor: l.assistencias, extra: `${l.jogos}j` }))}
        />
        <Tabela
          titulo="Melhores notas" icone="📝" colunas={["Jogador", "Média"]}
          dados={comJogos.filter((l) => l.notaMedia !== null).sort((a, b) => (b.notaMedia ?? 0) - (a.notaMedia ?? 0))
            .map((l) => ({ chave: l.atletaId, nome: nome(l), valor: l.notaMedia!.toFixed(1), extra: `${l.jogos}j` }))}
        />
        <Tabela
          titulo="Craques da partida" icone="⭐" colunas={["Jogador", "Votos"]}
          dados={comJogos.filter((l) => l.craques > 0).sort((a, b) => b.craques - a.craques)
            .map((l) => ({ chave: l.atletaId, nome: nome(l), valor: l.craques }))}
        />
        <Tabela
          titulo="Assiduidade" icone="📅" colunas={["Jogador", "Presenças"]}
          dados={[...comJogos].sort((a, b) => b.jogos - a.jogos)
            .map((l) => ({
              chave: l.atletaId, nome: nome(l), valor: l.jogos,
              extra: totalJogos ? `${Math.round((l.jogos / totalJogos) * 100)}%` : undefined,
            }))}
        />
        <Tabela
          titulo="Paredão (goleiros)" icone="🧤" colunas={["Goleiro", "Jogos s/ sofrer"]}
          dados={comJogos.filter((l) => l.jogosSemSofrer > 0 || l.golsSofridos > 0)
            .sort((a, b) => b.jogosSemSofrer - a.jogosSemSofrer)
            .map((l) => ({ chave: l.atletaId, nome: nome(l), valor: l.jogosSemSofrer, extra: `${l.golsSofridos} sofridos` }))}
        />
      </div>
    </Pagina>
  );
}
