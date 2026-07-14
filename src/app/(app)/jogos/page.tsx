import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { fmtDataHora } from "@/lib/format";
import { Pagina, PageHeader, Vazio } from "@/components/ui";

export default async function JogosPage() {
  const sessao = (await getSessao())!;
  const admin = sessao.role !== "ATLETA";
  const jogos = await prisma.jogo.findMany({
    orderBy: { dataHora: "desc" },
    include: { adversario: true, local: true, kit: true, confirmacoes: true },
  });
  const agendados = jogos.filter((j) => j.status === "AGENDADO").reverse();
  const passados = jogos.filter((j) => j.status !== "AGENDADO");

  const Cartao = ({ j }: { j: (typeof jogos)[number] }) => {
    const confirmados = j.confirmacoes.filter((c) => c.status === "CONFIRMADO").length;
    const fila = j.confirmacoes.filter((c) => c.status === "LISTA_ESPERA").length;
    const gp = j.golsPro ?? 0, gc = j.golsContra ?? 0;
    return (
      <Link href={`/jogos/${j.id}`} className="card p-4 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors">
        <div className="min-w-0">
          <div className="font-semibold truncate">
            {j.emCasa ? "" : "@ "}vs {j.adversario?.nome ?? "A definir"}
            {j.status === "CANCELADO" && <span className="badge bg-danger/15 text-danger ml-2">Cancelado</span>}
          </div>
          <div className="text-sm text-muted truncate">
            {fmtDataHora(j.dataHora)} · {j.local?.nome ?? "local a definir"} · {j.modalidade === "CAMPO" ? "Campo" : "Futsal"}
          </div>
          <div className="text-xs text-muted mt-0.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded-full border border-borda inline-block" style={{ background: j.kit.corPrimaria }} />
              {j.kit.nome}
            </span>
            {j.status === "AGENDADO" && (
              <span>· {confirmados}/{j.maxJogadores} confirmados{fila > 0 && ` · ${fila} na fila`}</span>
            )}
          </div>
        </div>
        {j.status === "ENCERRADO" && (
          <div className={`text-xl font-bold shrink-0 ${gp > gc ? "text-primary" : gp === gc ? "text-accent" : "text-danger"}`}>
            {gp} × {gc}
          </div>
        )}
      </Link>
    );
  };

  return (
    <Pagina>
      <PageHeader
        titulo="Jogos"
        subtitulo={`${agendados.length} agendado(s) · ${passados.length} realizados`}
        acao={admin ? <Link href="/jogos/novo" className="btn btn-primary">+ Novo jogo</Link> : undefined}
      />
      <h2 className="font-bold mb-3">Agendados</h2>
      {agendados.length === 0 && <Vazio mensagem="Nenhum jogo agendado." />}
      <div className="space-y-3 mb-8">{agendados.map((j) => <Cartao key={j.id} j={j} />)}</div>
      <h2 className="font-bold mb-3">Realizados</h2>
      {passados.length === 0 && <Vazio mensagem="Nenhum jogo realizado ainda." />}
      <div className="space-y-3">{passados.map((j) => <Cartao key={j.id} j={j} />)}</div>
    </Pagina>
  );
}
