import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { fmtData } from "@/lib/format";
import { Pagina, PageHeader, Vazio } from "@/components/ui";
import { FormFoto } from "@/components/FormFoto";
import { excluirFoto } from "@/server/outros-actions";

export default async function GaleriaPage() {
  const sessao = (await getSessao())!;
  const admin = sessao.role !== "ATLETA";

  const [fotos, jogos] = await Promise.all([
    prisma.foto.findMany({
      orderBy: { criadoEm: "desc" },
      include: { jogo: { include: { adversario: true } } },
    }),
    prisma.jogo.findMany({
      orderBy: { dataHora: "desc" },
      take: 20,
      include: { adversario: true },
    }),
  ]);

  return (
    <Pagina>
      <PageHeader titulo="Galeria" subtitulo="Fotos dos jogos e do grupo" />
      <FormFoto
        jogos={jogos.map((j) => ({
          id: j.id,
          rotulo: `${fmtData(j.dataHora)} — vs ${j.adversario?.nome ?? "?"}`,
        }))}
      />
      {fotos.length === 0 && <Vazio mensagem="Nenhuma foto ainda. Suba a primeira!" />}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-6">
        {fotos.map((f) => (
          <figure key={f.id} className="card overflow-hidden group relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.url} alt={f.legenda ?? "Foto do clube"} className="aspect-square object-cover w-full" />
            <figcaption className="p-2 text-xs text-muted">
              {f.legenda ?? ""}
              {f.jogo && <div className="text-[10px]">vs {f.jogo.adversario?.nome} · {fmtData(f.jogo.dataHora)}</div>}
            </figcaption>
            {admin && (
              <form action={excluirFoto} className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <input type="hidden" name="fotoId" value={f.id} />
                <button className="btn btn-danger px-2 py-0.5 text-xs bg-black/60">✕</button>
              </form>
            )}
          </figure>
        ))}
      </div>
    </Pagina>
  );
}
