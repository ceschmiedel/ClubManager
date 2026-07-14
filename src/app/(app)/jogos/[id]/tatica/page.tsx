import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { fmtDataHora } from "@/lib/format";
import { Pagina, PageHeader, LinkVoltar } from "@/components/ui";
import { MesaTatica } from "@/components/MesaTatica";

export default async function TaticaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = (await getSessao())!;
  const admin = sessao.role !== "ATLETA";

  const jogo = await prisma.jogo.findUnique({
    where: { id },
    include: {
      adversario: true,
      confirmacoes: { where: { status: "CONFIRMADO" }, include: { atleta: { include: { usuario: true } } } },
      formacao: { include: { posicoes: true } },
    },
  });
  if (!jogo) notFound();

  // Jogadores disponíveis: confirmados; se ninguém confirmou, todos os ativos
  let base = jogo.confirmacoes.map((c) => c.atleta);
  if (base.length === 0) {
    base = await prisma.atleta.findMany({
      where: { usuario: { ativo: true } },
      include: { usuario: true },
      orderBy: { usuario: { nome: "asc" } },
    });
  }
  // inclui também quem já está na formação salva
  const idsBase = new Set(base.map((a) => a.id));
  const extras = jogo.formacao
    ? await prisma.atleta.findMany({
        where: { id: { in: jogo.formacao.posicoes.map((p) => p.atletaId).filter((i) => !idsBase.has(i)) } },
        include: { usuario: true },
      })
    : [];

  const jogadores = [...base, ...extras].map((a) => ({
    atletaId: a.id,
    nome: a.apelido ?? a.usuario.nome,
    numero: a.numeroCamisa,
    posicao: jogo.modalidade === "FUTSAL" && a.posicaoFutsal ? a.posicaoFutsal : a.posicao,
  }));

  const inicial: Record<string, { x: number; y: number }> = {};
  for (const p of jogo.formacao?.posicoes ?? []) inicial[p.atletaId] = { x: p.x, y: p.y };

  return (
    <Pagina>
      <LinkVoltar href={`/jogos/${id}`} rotulo="Jogo" />
      <PageHeader
        titulo="🎯 Mesa tática"
        subtitulo={`vs ${jogo.adversario?.nome ?? "A definir"} · ${fmtDataHora(jogo.dataHora)} · ${jogo.modalidade === "CAMPO" ? "Campo" : "Futsal"}`}
      />
      <MesaTatica
        jogoId={id}
        modalidade={jogo.modalidade}
        jogadores={jogadores}
        inicial={inicial}
        esquemaInicial={jogo.formacao?.esquema ?? null}
        anotacoesIniciais={jogo.formacao?.anotacoes ?? null}
        podeEditar={admin}
      />
    </Pagina>
  );
}
