import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { fmtData } from "@/lib/format";
import { Pagina, PageHeader, Vazio } from "@/components/ui";
import { registrarLesao, encerrarLesao } from "@/server/outros-actions";

export default async function SaudePage() {
  const sessao = (await getSessao())!;
  if (sessao.role === "ATLETA") redirect("/");

  const [lesoes, atletas] = await Promise.all([
    prisma.lesao.findMany({
      orderBy: [{ ativa: "desc" }, { dataInicio: "desc" }],
      include: { atleta: { include: { usuario: true } } },
    }),
    prisma.atleta.findMany({
      where: { usuario: { ativo: true } },
      include: { usuario: true },
      orderBy: { usuario: { nome: "asc" } },
    }),
  ]);
  const ativas = lesoes.filter((l) => l.ativa);

  return (
    <Pagina>
      <PageHeader titulo="Saúde" subtitulo={`${ativas.length} atleta(s) no departamento médico`} />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          {lesoes.length === 0 && <Vazio mensagem="Nenhuma lesão registrada. Que continue assim! 🙏" />}
          <div className="space-y-2">
            {lesoes.map((l) => (
              <div key={l.id} className="card p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/atletas/${l.atletaId}`} className="font-semibold hover:text-primary">
                    {l.ativa ? "🤕" : "✅"} {l.atleta.apelido ?? l.atleta.usuario.nome}
                  </Link>
                  <div className="text-sm text-muted">{l.descricao}</div>
                  <div className="text-xs text-muted">
                    Desde {fmtData(l.dataInicio)}{l.dataRetorno && ` · retorno em ${fmtData(l.dataRetorno)}`}
                  </div>
                </div>
                {l.ativa && (
                  <form action={encerrarLesao}>
                    <input type="hidden" name="lesaoId" value={l.id} />
                    <button className="btn btn-primary text-xs">Dar alta ✓</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 h-fit">
          <h2 className="font-bold mb-3">+ Registrar lesão</h2>
          <form action={registrarLesao} className="space-y-3">
            <select name="atletaId" required className="input">
              <option value="">Atleta...</option>
              {atletas.map((a) => (
                <option key={a.id} value={a.id}>{a.apelido ?? a.usuario.nome}</option>
              ))}
            </select>
            <input name="descricao" required placeholder="Descrição (ex: estiramento na coxa)" className="input" />
            <input name="dataInicio" type="date" className="input" />
            <button className="btn btn-primary w-full">Registrar</button>
          </form>
        </div>
      </div>
    </Pagina>
  );
}
