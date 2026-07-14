import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { fmtMoeda, fmtData, fmtCompetencia, competenciaAtual, CATEGORIAS_LANCAMENTO } from "@/lib/format";
import { Pagina, PageHeader, StatCard, Vazio } from "@/components/ui";
import {
  gerarMensalidades, confirmarPagamento, estornarPagamento,
  criarLancamento, excluirLancamento,
} from "@/server/financeiro-actions";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ comp?: string }>;
}) {
  const sessao = (await getSessao())!;
  if (sessao.role === "ATLETA") redirect("/mensalidade");
  const { comp } = await searchParams;
  const competencia = comp && /^\d{4}-\d{2}$/.test(comp) ? comp : competenciaAtual();

  const [pagamentos, lancamentos] = await Promise.all([
    prisma.pagamento.findMany({
      where: { competencia },
      include: { atleta: { include: { usuario: true } } },
      orderBy: { atleta: { usuario: { nome: "asc" } } },
    }),
    prisma.lancamento.findMany({ orderBy: { data: "desc" }, take: 50 }),
  ]);

  const receitas = lancamentos.filter((l) => l.tipo === "RECEITA").reduce((s, l) => s + Number(l.valor), 0);
  const despesas = lancamentos.filter((l) => l.tipo === "DESPESA").reduce((s, l) => s + Number(l.valor), 0);
  const pagos = pagamentos.filter((p) => p.status === "PAGO").length;
  const aguardando = pagamentos.filter((p) => p.status === "AGUARDANDO_CONFIRMACAO").length;
  const pendentes = pagamentos.filter((p) => p.status === "PENDENTE").length;

  return (
    <Pagina>
      <PageHeader titulo="Financeiro" subtitulo="Mensalidades, receitas e despesas do clube" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard rotulo="Caixa (últ. lançamentos)" valor={fmtMoeda(receitas - despesas)} cor={receitas - despesas >= 0 ? "text-primary" : "text-danger"} />
        <StatCard rotulo="Receitas" valor={fmtMoeda(receitas)} cor="text-primary" />
        <StatCard rotulo="Despesas" valor={fmtMoeda(despesas)} cor="text-danger" />
        <StatCard rotulo={`Mensalidades ${fmtCompetencia(competencia)}`} valor={`${pagos}/${pagamentos.length}`} detalhe={`${aguardando} aguardando · ${pendentes} pendentes`} />
      </div>

      <section className="mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="font-bold">💸 Mensalidades — {fmtCompetencia(competencia)}</h2>
          <div className="flex gap-2 items-center">
            <form method="get" className="flex gap-2">
              <input type="month" name="comp" defaultValue={competencia} className="input w-40" />
              <button className="btn btn-outline">Ver</button>
            </form>
            <form action={gerarMensalidades}>
              <input type="hidden" name="competencia" value={competencia} />
              <button className="btn btn-primary">Gerar cobranças do mês</button>
            </form>
          </div>
        </div>
        {pagamentos.length === 0 ? (
          <Vazio mensagem="Nenhuma cobrança gerada para essa competência. Clique em 'Gerar cobranças do mês'." />
        ) : (
          <div className="card overflow-x-auto">
            <table className="tabela">
              <thead><tr><th>Atleta</th><th>Valor</th><th>Status</th><th>Pago em</th><th>Ações</th></tr></thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.atleta.usuario.nome}</td>
                    <td>{fmtMoeda(Number(p.valor))}</td>
                    <td>
                      {p.status === "PAGO" && <span className="badge bg-primary/15 text-primary">Pago</span>}
                      {p.status === "PENDENTE" && <span className="badge bg-danger/15 text-danger">Pendente</span>}
                      {p.status === "AGUARDANDO_CONFIRMACAO" && (
                        <span className="badge bg-accent/15 text-accent" title={p.comprovanteInfo ?? ""}>
                          Aguardando confirmação{p.comprovanteInfo ? " 📎" : ""}
                        </span>
                      )}
                      {p.status === "ISENTO" && <span className="badge bg-surface-2 text-muted">Isento</span>}
                    </td>
                    <td>{p.pagoEm ? `${fmtData(p.pagoEm)} (${p.confirmadoPor})` : "—"}</td>
                    <td>
                      <div className="flex gap-1.5">
                        {(p.status === "PENDENTE" || p.status === "AGUARDANDO_CONFIRMACAO") && (
                          <form action={confirmarPagamento}>
                            <input type="hidden" name="pagamentoId" value={p.id} />
                            <button className="btn btn-primary px-2 py-1 text-xs">Confirmar PIX</button>
                          </form>
                        )}
                        {p.status === "PAGO" && (
                          <form action={estornarPagamento}>
                            <input type="hidden" name="pagamentoId" value={p.id} />
                            <button className="btn btn-outline px-2 py-1 text-xs">Estornar</button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          <h2 className="font-bold mb-3">📒 Lançamentos</h2>
          {lancamentos.length === 0 ? (
            <Vazio mensagem="Nenhum lançamento." />
          ) : (
            <div className="card overflow-x-auto">
              <table className="tabela">
                <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th /></tr></thead>
                <tbody>
                  {lancamentos.map((l) => (
                    <tr key={l.id}>
                      <td>{fmtData(l.data)}</td>
                      <td>{l.descricao}</td>
                      <td className="text-muted">{l.categoria}</td>
                      <td className={l.tipo === "RECEITA" ? "text-primary font-semibold" : "text-danger font-semibold"}>
                        {l.tipo === "RECEITA" ? "+" : "−"} {fmtMoeda(Number(l.valor))}
                      </td>
                      <td>
                        <form action={excluirLancamento}>
                          <input type="hidden" name="lancamentoId" value={l.id} />
                          <button className="text-muted hover:text-danger text-xs">✕</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="card p-5 h-fit">
          <h2 className="font-bold mb-3">+ Novo lançamento</h2>
          <form action={criarLancamento} className="space-y-3">
            <select name="tipo" className="input">
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </select>
            <select name="categoria" className="input">
              {CATEGORIAS_LANCAMENTO.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input name="descricao" required placeholder="Descrição" className="input" />
            <input name="valor" required placeholder="Valor (R$)" className="input" />
            <input name="data" type="date" className="input" />
            <button className="btn btn-primary w-full">Lançar</button>
          </form>
        </div>
      </section>
    </Pagina>
  );
}
