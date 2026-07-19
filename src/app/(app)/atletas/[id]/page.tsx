import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { fmtData, fmtMoeda, fmtCompetencia, POSICOES } from "@/lib/format";
import { calcularRankings } from "@/server/stats";
import { obterClube } from "@/server/clube-actions";
import { Pagina, PageHeader, LinkVoltar, StatCard } from "@/components/ui";
import { FormAtleta } from "@/components/FormAtleta";
import { alternarAtivoUsuario, redefinirSenha } from "@/server/usuarios-actions";

const BADGE_ICONE: Record<string, string> = {
  JOGOS_10: "🥉", JOGOS_25: "🥈", JOGOS_50: "🥇", JOGOS_100: "💎",
  GOLS_10: "⚽", GOLS_25: "🔥", GOLS_50: "👑",
  CRAQUE_3: "⭐", PAREDAO: "🧤",
};

export default async function AtletaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = (await getSessao())!;
  const admin = sessao.role !== "ATLETA";
  if (!admin && sessao.atletaId !== id) redirect("/");

  const atleta = await prisma.atleta.findUnique({
    where: { id },
    include: {
      usuario: true,
      badges: { orderBy: { ganhoEm: "desc" } },
      lesoes: { orderBy: { dataInicio: "desc" } },
      pagamentos: { orderBy: { competencia: "desc" }, take: 6 },
    },
  });
  if (!atleta) notFound();

  const stats = (await calcularRankings()).find((r) => r.atletaId === id);
  const clube = await obterClube();

  return (
    <Pagina>
      <LinkVoltar href={admin ? "/atletas" : "/"} rotulo={admin ? "Atletas" : "Início"} />
      <PageHeader
        titulo={`${atleta.numeroCamisa ? `#${atleta.numeroCamisa} ` : ""}${atleta.apelido ?? atleta.usuario.nome}`}
        subtitulo={`${atleta.usuario.nome} · ${POSICOES[atleta.posicao]}${atleta.posicaoFutsal ? ` / ${POSICOES[atleta.posicaoFutsal]} (futsal)` : ""}${!atleta.usuario.ativo ? " · INATIVO" : ""}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard rotulo="Jogos" valor={stats?.jogos ?? 0} />
        <StatCard rotulo="Gols" valor={stats?.gols ?? 0} />
        <StatCard rotulo="Assistências" valor={stats?.assistencias ?? 0} />
        <StatCard rotulo="Nota média" valor={stats?.notaMedia ?? "—"} cor="text-accent" />
        <StatCard rotulo="Craque da partida" valor={`${stats?.craques ?? 0}×`} cor="text-primary" />
      </div>

      {atleta.badges.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-3">🏅 Conquistas</h2>
          <div className="flex flex-wrap gap-2">
            {atleta.badges.map((b) => (
              <span key={b.id} className="badge bg-accent/10 text-accent border border-accent/25 py-1.5 px-3">
                {BADGE_ICONE[b.codigo] ?? "🏅"} {b.rotulo}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card p-5 text-sm space-y-1.5">
          <h2 className="font-bold mb-2">Dados</h2>
          <p><span className="text-muted">E-mail:</span> {atleta.usuario.email}</p>
          <p><span className="text-muted">Telefone:</span> {atleta.usuario.telefone ?? "—"}</p>
          <p><span className="text-muted">Nascimento:</span> {fmtData(atleta.nascimento)}</p>
          <p><span className="text-muted">Pé dominante:</span> {atleta.peDominante ?? "—"}</p>
          <p><span className="text-muted">Sócio desde:</span> {fmtData(atleta.socioDesde)}</p>
          <p><span className="text-muted">Mensalidade:</span> {atleta.isento ? "Isento" : "Paga"}</p>
        </div>
        <div className="card p-5 text-sm space-y-1.5">
          <h2 className="font-bold mb-2">🩺 Saúde e emergência</h2>
          <p><span className="text-muted">Tipo sanguíneo:</span> {atleta.tipoSanguineo ?? "—"}</p>
          <p><span className="text-muted">Convênio:</span> {atleta.convenio ?? "—"}</p>
          <p><span className="text-muted">Emergência:</span> {atleta.contatoEmergenciaNome ?? "—"} {atleta.contatoEmergenciaFone && `(${atleta.contatoEmergenciaFone})`}</p>
          {atleta.observacoesSaude && <p><span className="text-muted">Obs.:</span> {atleta.observacoesSaude}</p>}
          {atleta.lesoes.length > 0 && (
            <div className="pt-2">
              <div className="label">Histórico de lesões</div>
              <ul className="space-y-1">
                {atleta.lesoes.map((l) => (
                  <li key={l.id}>
                    {l.ativa ? "🤕" : "✅"} {l.descricao}{" "}
                    <span className="text-muted text-xs">
                      ({fmtData(l.dataInicio)}{l.dataRetorno ? ` → ${fmtData(l.dataRetorno)}` : " — em recuperação"})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {clube.mensalidadeAtiva && atleta.pagamentos.length > 0 && (
        <section className="mb-6">
          <h2 className="font-bold mb-3">💸 Últimas mensalidades</h2>
          <div className="card overflow-x-auto">
            <table className="tabela">
              <thead><tr><th>Competência</th><th>Valor</th><th>Status</th></tr></thead>
              <tbody>
                {atleta.pagamentos.map((p) => (
                  <tr key={p.id}>
                    <td>{fmtCompetencia(p.competencia)}</td>
                    <td>{fmtMoeda(Number(p.valor))}</td>
                    <td>
                      {p.status === "PAGO" && <span className="badge bg-success/15 text-success">Pago</span>}
                      {p.status === "PENDENTE" && <span className="badge bg-danger/15 text-danger">Pendente</span>}
                      {p.status === "AGUARDANDO_CONFIRMACAO" && <span className="badge bg-accent/15 text-accent">Aguardando</span>}
                      {p.status === "ISENTO" && <span className="badge bg-surface-2 text-muted">Isento</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {admin && (
        <>
          <details className="card p-5 mb-4">
            <summary className="cursor-pointer font-bold">✏️ Editar cadastro</summary>
            <div className="mt-4">
              <FormAtleta
                atleta={{
                  atletaId: atleta.id,
                  nome: atleta.usuario.nome,
                  telefone: atleta.usuario.telefone,
                  apelido: atleta.apelido,
                  posicao: atleta.posicao,
                  posicaoFutsal: atleta.posicaoFutsal,
                  numeroCamisa: atleta.numeroCamisa,
                  nascimento: atleta.nascimento ? atleta.nascimento.toISOString().slice(0, 10) : null,
                  peDominante: atleta.peDominante,
                  tipoSanguineo: atleta.tipoSanguineo,
                  convenio: atleta.convenio,
                  contatoEmergenciaNome: atleta.contatoEmergenciaNome,
                  contatoEmergenciaFone: atleta.contatoEmergenciaFone,
                  observacoesSaude: atleta.observacoesSaude,
                  isento: atleta.isento,
                }}
              />
            </div>
          </details>
          <div className="flex flex-wrap gap-2">
            <form action={alternarAtivoUsuario}>
              <input type="hidden" name="usuarioId" value={atleta.usuarioId} />
              <button className={`btn ${atleta.usuario.ativo ? "btn-danger" : "btn-primary"}`}>
                {atleta.usuario.ativo ? "Desativar atleta" : "Reativar atleta"}
              </button>
            </form>
            <form action={redefinirSenha} className="flex gap-2">
              <input type="hidden" name="usuarioId" value={atleta.usuarioId} />
              <input name="senha" placeholder="Nova senha" className="input w-40" />
              <button className="btn btn-outline">Redefinir senha</button>
            </form>
          </div>
        </>
      )}
    </Pagina>
  );
}
