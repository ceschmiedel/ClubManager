import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { Pagina, PageHeader, LinkVoltar } from "@/components/ui";
import { FormJogo } from "@/components/FormJogo";

export default async function EditarJogoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = (await getSessao())!;
  if (sessao.role === "ATLETA") redirect(`/jogos/${id}`);

  const [jogo, adversarios, locais, competicoes, kits] = await Promise.all([
    prisma.jogo.findUnique({ where: { id } }),
    prisma.adversario.findMany({ orderBy: { nome: "asc" } }),
    prisma.local.findMany({ orderBy: { nome: "asc" } }),
    prisma.competicao.findMany({ orderBy: { nome: "asc" } }),
    prisma.kit.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);
  if (!jogo) notFound();

  const local = new Date(jogo.dataHora.getTime() - jogo.dataHora.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <Pagina>
      <LinkVoltar href={`/jogos/${id}`} rotulo="Jogo" />
      <PageHeader titulo="Editar jogo" />
      <FormJogo
        jogo={{
          id: jogo.id,
          dataHora: local,
          modalidade: jogo.modalidade,
          adversarioId: jogo.adversarioId,
          localId: jogo.localId,
          competicaoId: jogo.competicaoId,
          kitId: jogo.kitId,
          maxJogadores: jogo.maxJogadores,
          emCasa: jogo.emCasa,
          observacoes: jogo.observacoes,
        }}
        adversarios={adversarios}
        locais={locais}
        competicoes={competicoes}
        kits={kits.map((k) => ({ id: k.id, nome: k.nome, corPrimaria: k.corPrimaria, tipo: k.tipo }))}
      />
    </Pagina>
  );
}
