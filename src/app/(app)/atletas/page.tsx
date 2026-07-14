import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { POSICOES } from "@/lib/format";
import { Pagina, PageHeader, Vazio } from "@/components/ui";

export default async function AtletasPage() {
  const sessao = (await getSessao())!;
  if (sessao.role === "ATLETA") redirect("/");

  const atletas = await prisma.atleta.findMany({
    include: { usuario: true, lesoes: { where: { ativa: true } } },
    orderBy: { usuario: { nome: "asc" } },
  });

  return (
    <Pagina>
      <PageHeader
        titulo="Atletas"
        subtitulo={`${atletas.filter((a) => a.usuario.ativo).length} ativos`}
        acao={<Link href="/atletas/novo" className="btn btn-primary">+ Novo atleta</Link>}
      />
      {atletas.length === 0 && <Vazio mensagem="Nenhum atleta cadastrado." />}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {atletas.map((a) => (
          <Link key={a.id} href={`/atletas/${a.id}`} className={`card p-4 hover:border-primary/40 transition-colors ${!a.usuario.ativo ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-black text-primary">
                {a.numeroCamisa ?? a.usuario.nome.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">
                  {a.apelido ?? a.usuario.nome}
                  {a.lesoes.length > 0 && <span title="Lesionado"> 🤕</span>}
                </div>
                <div className="text-xs text-muted">
                  {POSICOES[a.posicao]}{!a.usuario.ativo && " · inativo"}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Pagina>
  );
}
