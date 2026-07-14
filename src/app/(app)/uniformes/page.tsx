import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { fmtData } from "@/lib/format";
import { Pagina, PageHeader, Vazio } from "@/components/ui";
import { FormKit } from "@/components/FormKit";
import { alternarAtivoKit, salvarPecaKit, excluirPecaKit } from "@/server/uniformes-actions";

export default async function UniformesPage() {
  const sessao = (await getSessao())!;
  if (sessao.role === "ATLETA") redirect("/");

  const kits = await prisma.kit.findMany({
    include: {
      pecas: { orderBy: { tamanho: "asc" } },
      jogos: { orderBy: { dataHora: "desc" }, take: 5, include: { adversario: true } },
      _count: { select: { jogos: true } },
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  });

  return (
    <Pagina>
      <PageHeader
        titulo="Uniformes"
        subtitulo="Todo jogo precisa ter um kit escolhido no cadastro"
      />
      {kits.length === 0 && <Vazio mensagem="Nenhum kit cadastrado ainda." />}
      <div className="grid lg:grid-cols-2 gap-4 mb-8">
        {kits.map((k) => (
          <div key={k.id} className={`card p-5 ${!k.ativo ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                {/* mini uniforme */}
                <div className="flex flex-col items-center gap-0.5">
                  <div className="h-8 w-10 rounded-t-lg border border-borda" style={{ background: k.corPrimaria, borderBottom: k.corSecundaria ? `3px solid ${k.corSecundaria}` : undefined }} />
                  <div className="h-4 w-8 border border-borda" style={{ background: k.corCalcao ?? "#333" }} />
                  <div className="h-3 w-6 rounded-b border border-borda" style={{ background: k.corMeiao ?? "#333" }} />
                </div>
                <div>
                  <div className="font-bold">{k.nome}</div>
                  <div className="text-xs text-muted">
                    {k.tipo.charAt(0) + k.tipo.slice(1).toLowerCase()}
                    {k.ano ? ` · ${k.ano}` : ""}{k.fornecedor ? ` · ${k.fornecedor}` : ""}
                  </div>
                  <div className="text-xs text-muted mt-0.5">Usado em {k._count.jogos} jogo(s)</div>
                </div>
              </div>
              <form action={alternarAtivoKit}>
                <input type="hidden" name="kitId" value={k.id} />
                <button className="btn btn-outline px-2 py-1 text-xs">{k.ativo ? "Aposentar" : "Reativar"}</button>
              </form>
            </div>

            <div className="mb-3">
              <div className="label">Estoque por tamanho</div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {k.pecas.map((p) => (
                  <form key={p.id} action={excluirPecaKit}>
                    <input type="hidden" name="pecaId" value={p.id} />
                    <button className="badge bg-surface-2 border border-borda hover:border-danger" title="Clique para remover">
                      {p.tamanho}: {p.quantidade}
                    </button>
                  </form>
                ))}
                {k.pecas.length === 0 && <span className="text-xs text-muted">Sem estoque lançado</span>}
              </div>
              <form action={salvarPecaKit} className="flex gap-2">
                <input type="hidden" name="kitId" value={k.id} />
                <input name="tamanho" placeholder="Tam. (P/M/G/GG)" className="input w-32 text-xs" />
                <input name="quantidade" type="number" min={0} placeholder="Qtd" className="input w-20 text-xs" />
                <button className="btn btn-outline text-xs px-3">Lançar</button>
              </form>
            </div>

            {k.jogos.length > 0 && (
              <details className="text-sm">
                <summary className="cursor-pointer text-muted text-xs font-semibold uppercase">Últimos usos</summary>
                <ul className="mt-2 space-y-1 text-xs text-muted">
                  {k.jogos.map((j) => (
                    <li key={j.id}>{fmtData(j.dataHora)} — vs {j.adversario?.nome ?? "?"}</li>
                  ))}
                </ul>
              </details>
            )}

            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-semibold uppercase text-muted">✏️ Editar kit</summary>
              <div className="mt-3">
                <FormKit kit={{
                  id: k.id, nome: k.nome, tipo: k.tipo, corPrimaria: k.corPrimaria,
                  corSecundaria: k.corSecundaria, corCalcao: k.corCalcao, corMeiao: k.corMeiao,
                  fornecedor: k.fornecedor, ano: k.ano, observacoes: k.observacoes,
                }} />
              </div>
            </details>
          </div>
        ))}
      </div>

      <div className="card p-6 max-w-2xl">
        <h2 className="font-bold mb-4">+ Novo kit</h2>
        <FormKit />
      </div>
    </Pagina>
  );
}
