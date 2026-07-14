import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { Pagina, PageHeader, Vazio } from "@/components/ui";
import { criarCompeticao } from "@/server/outros-actions";

export default async function CompeticoesPage() {
  const sessao = (await getSessao())!;
  if (sessao.role === "ATLETA") redirect("/");

  const competicoes = await prisma.competicao.findMany({
    include: { jogos: { where: { status: "ENCERRADO" } } },
    orderBy: { nome: "asc" },
  });

  return (
    <Pagina>
      <PageHeader titulo="Competições" subtitulo="Campeonatos e torneios que o clube disputa" />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          {competicoes.length === 0 && <Vazio mensagem="Nenhuma competição cadastrada. Jogos sem competição contam como amistosos." />}
          <div className="space-y-3">
            {competicoes.map((c) => {
              let v = 0, e = 0, d = 0, gp = 0, gc = 0;
              for (const j of c.jogos) {
                gp += j.golsPro ?? 0; gc += j.golsContra ?? 0;
                if ((j.golsPro ?? 0) > (j.golsContra ?? 0)) v++;
                else if ((j.golsPro ?? 0) === (j.golsContra ?? 0)) e++;
                else d++;
              }
              return (
                <div key={c.id} className="card p-5">
                  <div className="font-bold">{c.nome} {c.temporada && <span className="text-muted font-normal text-sm">· {c.temporada}</span>}</div>
                  {c.descricao && <p className="text-sm text-muted mt-0.5">{c.descricao}</p>}
                  <div className="flex gap-4 mt-3 text-sm">
                    <span>{c.jogos.length} jogos</span>
                    <span className="text-primary font-semibold">{v}V</span>
                    <span className="text-accent">{e}E</span>
                    <span className="text-danger">{d}D</span>
                    <span className="text-muted">{gp}×{gc} gols</span>
                    <span className="font-bold">{v * 3 + e} pts</span>
                  </div>
                  <Link href={`/historico`} className="text-xs text-primary hover:underline mt-2 inline-block">
                    Ver jogos →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5 h-fit">
          <h2 className="font-bold mb-3">+ Nova competição</h2>
          <form action={criarCompeticao} className="space-y-3">
            <input name="nome" required placeholder="Ex: Copa dos Amigos" className="input" />
            <input name="temporada" placeholder="Temporada (ex: 2026)" className="input" />
            <input name="descricao" placeholder="Descrição" className="input" />
            <button className="btn btn-primary w-full">Cadastrar</button>
          </form>
        </div>
      </div>
    </Pagina>
  );
}
