import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { fmtDataHora } from "@/lib/format";
import { Pagina, PageHeader, Vazio } from "@/components/ui";
import { criarAviso, excluirAviso } from "@/server/outros-actions";

export default async function AvisosPage() {
  const sessao = (await getSessao())!;
  const admin = sessao.role !== "ATLETA";
  const avisos = await prisma.aviso.findMany({
    orderBy: [{ fixado: "desc" }, { criadoEm: "desc" }],
    include: { autor: true },
  });

  return (
    <Pagina>
      <PageHeader titulo="Avisos" subtitulo="Mural do clube" />
      {admin && (
        <form action={criarAviso} className="card p-5 mb-6 space-y-3 max-w-2xl">
          <input name="titulo" required placeholder="Título do aviso" className="input" />
          <textarea name="texto" required rows={3} placeholder="Texto do aviso..." className="input" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="fixado" className="h-4 w-4 accent-[var(--primary)]" /> 📌 Fixar no topo
            </label>
            <button className="btn btn-primary">Publicar</button>
          </div>
        </form>
      )}
      {avisos.length === 0 && <Vazio mensagem="Nenhum aviso publicado." />}
      <div className="space-y-3 max-w-2xl">
        {avisos.map((a) => (
          <div key={a.id} className={`card p-5 ${a.fixado ? "border-accent/40" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-bold">{a.fixado && "📌 "}{a.titulo}</h2>
              {admin && (
                <form action={excluirAviso}>
                  <input type="hidden" name="avisoId" value={a.id} />
                  <button className="text-muted hover:text-danger text-sm">✕</button>
                </form>
              )}
            </div>
            <p className="text-sm mt-1 whitespace-pre-wrap">{a.texto}</p>
            <p className="text-xs text-muted mt-2">{a.autor.nome} · {fmtDataHora(a.criadoEm)}</p>
          </div>
        ))}
      </div>
    </Pagina>
  );
}
