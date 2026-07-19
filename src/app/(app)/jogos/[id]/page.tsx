import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { fmtDataHora } from "@/lib/format";
import { craqueDoJogo } from "@/server/stats";
import { Pagina, PageHeader, LinkVoltar, Vazio } from "@/components/ui";
import {
  responderConvocacao, cancelarJogo, reabrirJogo,
  registrarResultado, darNotas, votarCraque, comentarJogo,
} from "@/server/jogos-actions";

export default async function JogoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = (await getSessao())!;
  const admin = sessao.role !== "ATLETA";

  const jogo = await prisma.jogo.findUnique({
    where: { id },
    include: {
      adversario: true, local: true, kit: true, competicao: true,
      confirmacoes: {
        orderBy: { criadoEm: "asc" },
        include: { atleta: { include: { usuario: true } } },
      },
      participacoes: { include: { atleta: { include: { usuario: true } } } },
      notas: true,
      votosCraque: true,
      comentarios: { orderBy: { criadoEm: "desc" }, include: { autor: true } },
      formacao: { include: { posicoes: true } },
    },
  });
  if (!jogo) notFound();

  const confirmados = jogo.confirmacoes.filter((c) => c.status === "CONFIRMADO");
  const fila = jogo.confirmacoes.filter((c) => c.status === "LISTA_ESPERA");
  const recusados = jogo.confirmacoes.filter((c) => c.status === "RECUSADO");
  const minha = jogo.confirmacoes.find((c) => c.atletaId === sessao.atletaId)?.status;
  const craque = jogo.status === "ENCERRADO" ? await craqueDoJogo(id) : null;
  const participantes = jogo.participacoes.filter((p) => p.presente);
  const meuVoto = jogo.votosCraque.find((v) => v.votanteId === sessao.atletaId)?.votadoId;
  const jaJoguei = participantes.some((p) => p.atletaId === sessao.atletaId);

  // Para o formulário de resultado: confirmados primeiro, depois demais atletas ativos
  const todosAtletas = admin && jogo.status !== "CANCELADO"
    ? await prisma.atleta.findMany({
        where: { usuario: { ativo: true } },
        include: { usuario: true },
        orderBy: { usuario: { nome: "asc" } },
      })
    : [];
  const confirmadosIds = new Set(confirmados.map((c) => c.atletaId));
  const atletasOrdenados = [...todosAtletas].sort(
    (a, b) => Number(confirmadosIds.has(b.id)) - Number(confirmadosIds.has(a.id))
  );
  const partPorAtleta = new Map(jogo.participacoes.map((p) => [p.atletaId, p]));
  const nomeAtleta = (a: { apelido: string | null; usuario: { nome: string } }) =>
    a.apelido ?? a.usuario.nome;

  const gp = jogo.golsPro ?? 0, gc = jogo.golsContra ?? 0;
  const corPlacar = gp > gc ? "text-success" : gp === gc ? "text-accent" : "text-danger";

  return (
    <Pagina>
      <LinkVoltar href="/jogos" rotulo="Jogos" />
      <PageHeader
        titulo={`${jogo.emCasa ? "" : "@ "}vs ${jogo.adversario?.nome ?? "A definir"}`}
        subtitulo={`${fmtDataHora(jogo.dataHora)} · ${jogo.local?.nome ?? "local a definir"} · ${jogo.modalidade === "CAMPO" ? "Campo" : "Futsal"} · ${jogo.competicao?.nome ?? "Amistoso"}`}
        acao={
          admin ? (
            <div className="flex gap-2">
              <Link href={`/jogos/${id}/tatica`} className="btn btn-outline">🎯 Mesa tática</Link>
              {jogo.status === "AGENDADO" && (
                <Link href={`/jogos/${id}/editar`} className="btn btn-outline">Editar</Link>
              )}
            </div>
          ) : (
            <Link href={`/jogos/${id}/tatica`} className="btn btn-outline">🎯 Ver tática</Link>
          )
        }
      />

      {/* Placar / status + kit */}
      <div className="card p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {jogo.status === "ENCERRADO" ? (
            jogo.golsPro === null || jogo.golsContra === null ? (
              <span className="badge bg-surface-2 text-muted text-sm">Encerrado — placar não informado</span>
            ) : (
              <div className={`text-4xl font-black ${corPlacar}`}>{gp} × {gc}</div>
            )
          ) : jogo.status === "CANCELADO" ? (
            <span className="badge bg-danger/15 text-danger text-sm">Jogo cancelado</span>
          ) : (
            <span className="badge bg-primary/15 text-primary text-sm">Agendado</span>
          )}
          {craque && (
            <div className="text-sm">
              <span className="text-accent font-bold">⭐ Craque da partida:</span> {craque.nome}{" "}
              <span className="text-muted">({craque.votos} voto{craque.votos > 1 ? "s" : ""})</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">Kit do jogo:</span>
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="h-5 w-5 rounded-full border border-borda" style={{ background: jogo.kit.corPrimaria }} />
            {jogo.kit.corSecundaria && (
              <span className="h-5 w-5 rounded-full border border-borda -ml-3" style={{ background: jogo.kit.corSecundaria }} />
            )}
            {jogo.kit.nome}
          </span>
        </div>
      </div>

      {jogo.observacoes && (
        <div className="card p-4 mb-6 text-sm">
          <span className="font-semibold">📋 Combinados: </span>{jogo.observacoes}
        </div>
      )}

      {/* Confirmação de presença */}
      {jogo.status === "AGENDADO" && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold">
              Presenças{" "}
              <span className={`text-sm font-semibold ${confirmados.length >= jogo.maxJogadores ? "text-accent" : "text-success"}`}>
                {confirmados.length}/{jogo.maxJogadores}
              </span>
            </h2>
            {sessao.atletaId && (
              <div className="flex gap-2">
                <form action={responderConvocacao}>
                  <input type="hidden" name="jogoId" value={id} />
                  <input type="hidden" name="resposta" value="sim" />
                  <button className={`btn ${minha === "CONFIRMADO" || minha === "LISTA_ESPERA" ? "btn-primary" : "btn-outline"}`}>
                    {minha === "LISTA_ESPERA" ? "⏳ Na fila de espera" : minha === "CONFIRMADO" ? "✓ Confirmado" : "Vou jogar"}
                  </button>
                </form>
                <form action={responderConvocacao}>
                  <input type="hidden" name="jogoId" value={id} />
                  <input type="hidden" name="resposta" value="nao" />
                  <button className={`btn ${minha === "RECUSADO" ? "btn-danger" : "btn-outline"}`}>Não vou</button>
                </form>
              </div>
            )}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="label">✅ Confirmados ({confirmados.length})</div>
              <ul className="text-sm space-y-1">
                {confirmados.map((c) => <li key={c.id}>{nomeAtleta(c.atleta)}</li>)}
                {confirmados.length === 0 && <li className="text-muted">Ninguém ainda</li>}
              </ul>
            </div>
            <div className="card p-4">
              <div className="label">⏳ Lista de espera ({fila.length})</div>
              <ul className="text-sm space-y-1">
                {fila.map((c, i) => <li key={c.id}><span className="text-muted">{i + 1}º</span> {nomeAtleta(c.atleta)}</li>)}
                {fila.length === 0 && <li className="text-muted">Fila vazia</li>}
              </ul>
            </div>
            <div className="card p-4">
              <div className="label">❌ Não vão ({recusados.length})</div>
              <ul className="text-sm space-y-1">
                {recusados.map((c) => <li key={c.id}>{nomeAtleta(c.atleta)}</li>)}
                {recusados.length === 0 && <li className="text-muted">—</li>}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Estatísticas do jogo encerrado */}
      {jogo.status === "ENCERRADO" && participantes.length > 0 && (
        <section className="mb-8">
          <h2 className="font-bold mb-3">📊 Estatísticas da partida</h2>
          <div className="card overflow-x-auto">
            <table className="tabela">
              <thead>
                <tr><th>Jogador</th><th>⚽ Gols</th><th>👟 Assist.</th><th>🟨</th><th>🟥</th><th>🧤 Sofridos</th></tr>
              </thead>
              <tbody>
                {participantes.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{nomeAtleta(p.atleta)}</td>
                    <td>{p.gols || "—"}</td>
                    <td>{p.assistencias || "—"}</td>
                    <td>{p.cartaoAmarelo || "—"}</td>
                    <td>{p.cartaoVermelho || "—"}</td>
                    <td>{p.golsSofridos ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Votação craque + notas (atletas que jogaram) */}
      {jogo.status === "ENCERRADO" && sessao.atletaId && jaJoguei && participantes.length > 1 && (
        <section className="mb-8 grid lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="font-bold mb-3">⭐ Vote no craque da partida</h2>
            <form action={votarCraque} className="space-y-2">
              <input type="hidden" name="jogoId" value={id} />
              {participantes.filter((p) => p.atletaId !== sessao.atletaId).map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
                  <input type="radio" name="votadoId" value={p.atletaId} defaultChecked={meuVoto === p.atletaId} className="accent-[var(--primary)]" />
                  {nomeAtleta(p.atleta)}
                </label>
              ))}
              <button className="btn btn-primary mt-2">{meuVoto ? "Trocar voto" : "Votar"}</button>
            </form>
          </div>
          <div className="card p-5">
            <h2 className="font-bold mb-3">📝 Dê suas notas (0 a 10)</h2>
            <form action={darNotas} className="space-y-2">
              <input type="hidden" name="jogoId" value={id} />
              {participantes.filter((p) => p.atletaId !== sessao.atletaId).map((p) => {
                const notaExistente = jogo.notas.find(
                  (n) => n.avaliadoId === p.atletaId && n.avaliadorId === sessao.atletaId
                );
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>{nomeAtleta(p.atleta)}</span>
                    <span>
                      <input type="hidden" name="avaliadoId" value={p.atletaId} />
                      <input
                        type="number" name={`nota_${p.atletaId}`} min={0} max={10} step={0.5}
                        defaultValue={notaExistente ? Number(notaExistente.nota) : undefined}
                        className="input w-20 text-center" placeholder="—"
                      />
                    </span>
                  </div>
                );
              })}
              <button className="btn btn-primary mt-2">Salvar notas</button>
            </form>
          </div>
        </section>
      )}

      {/* Admin: registrar resultado */}
      {admin && jogo.status !== "CANCELADO" && (
        <section className="mb-8">
          <details className="card p-5" open={jogo.status === "AGENDADO" && new Date(jogo.dataHora) < new Date()}>
            <summary className="cursor-pointer font-bold">
              {jogo.status === "ENCERRADO" ? "✏️ Editar resultado e estatísticas" : "🏁 Registrar resultado"}
            </summary>
            <form action={registrarResultado} className="mt-4 space-y-4">
              <input type="hidden" name="jogoId" value={id} />
              <div className="flex items-center gap-3">
                <div>
                  <label className="label">Nossos gols</label>
                  <input type="number" name="golsPro" min={0} defaultValue={jogo.golsPro ?? 0} className="input w-24 text-center text-lg font-bold" />
                </div>
                <span className="text-2xl font-bold mt-5">×</span>
                <div>
                  <label className="label">Gols deles</label>
                  <input type="number" name="golsContra" min={0} defaultValue={jogo.golsContra ?? 0} className="input w-24 text-center text-lg font-bold" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="tabela">
                  <thead>
                    <tr><th>Jogou?</th><th>Jogador</th><th>Gols</th><th>Assist.</th><th>🟨</th><th>🟥</th><th>Gols sofridos (goleiro)</th></tr>
                  </thead>
                  <tbody>
                    {atletasOrdenados.map((a) => {
                      const p = partPorAtleta.get(a.id);
                      const marcado = p ? p.presente : confirmadosIds.has(a.id);
                      return (
                        <tr key={a.id}>
                          <td>
                            <input type="hidden" name="atletaId" value={a.id} />
                            <input type="checkbox" name={`presente_${a.id}`} defaultChecked={marcado} className="h-4 w-4 accent-[var(--primary)]" />
                          </td>
                          <td className="font-medium">{a.apelido ?? a.usuario.nome}</td>
                          <td><input type="number" name={`gols_${a.id}`} min={0} defaultValue={p?.gols || ""} className="input w-16 text-center" /></td>
                          <td><input type="number" name={`assistencias_${a.id}`} min={0} defaultValue={p?.assistencias || ""} className="input w-16 text-center" /></td>
                          <td><input type="number" name={`amarelo_${a.id}`} min={0} defaultValue={p?.cartaoAmarelo || ""} className="input w-14 text-center" /></td>
                          <td><input type="number" name={`vermelho_${a.id}`} min={0} defaultValue={p?.cartaoVermelho || ""} className="input w-14 text-center" /></td>
                          <td>
                            <input type="number" name={`sofridos_${a.id}`} min={0}
                              defaultValue={p?.golsSofridos ?? ""}
                              placeholder={a.posicao === "GOLEIRO" ? "0" : "—"}
                              className="input w-16 text-center" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-primary">Salvar resultado e encerrar jogo</button>
            </form>
          </details>
        </section>
      )}

      {/* Mural do jogo */}
      <section className="mb-8">
        <h2 className="font-bold mb-3">💬 Mural do jogo</h2>
        <form action={comentarJogo} className="flex gap-2 mb-4">
          <input type="hidden" name="jogoId" value={id} />
          <input name="texto" required placeholder="Escreva um recado para o grupo..." className="input flex-1" />
          <button className="btn btn-primary shrink-0">Enviar</button>
        </form>
        {jogo.comentarios.length === 0 && <Vazio mensagem="Nenhum recado ainda. Quebre o gelo!" />}
        <div className="space-y-2">
          {jogo.comentarios.map((c) => (
            <div key={c.id} className="card p-3 text-sm">
              <span className="font-semibold text-primary">{c.autor.nome}</span>{" "}
              <span className="text-muted text-xs">{fmtDataHora(c.criadoEm)}</span>
              <div className="mt-0.5">{c.texto}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Ações administrativas */}
      {admin && (
        <div className="flex gap-2">
          {jogo.status === "AGENDADO" && (
            <form action={cancelarJogo}>
              <input type="hidden" name="jogoId" value={id} />
              <button className="btn btn-danger">Cancelar jogo</button>
            </form>
          )}
          {jogo.status === "ENCERRADO" && (
            <form action={reabrirJogo}>
              <input type="hidden" name="jogoId" value={id} />
              <button className="btn btn-outline">Reabrir jogo</button>
            </form>
          )}
        </div>
      )}
    </Pagina>
  );
}
