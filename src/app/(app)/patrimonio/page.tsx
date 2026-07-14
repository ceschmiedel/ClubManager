import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { fmtData } from "@/lib/format";
import { Pagina, PageHeader, Vazio } from "@/components/ui";
import { criarPatrimonio, registrarEmprestimo, devolverEmprestimo } from "@/server/outros-actions";

export default async function PatrimonioPage() {
  const sessao = (await getSessao())!;
  if (sessao.role === "ATLETA") redirect("/");

  const [itens, atletas] = await Promise.all([
    prisma.patrimonio.findMany({
      include: {
        emprestimos: {
          where: { devolvidoEm: null },
          include: { atleta: { include: { usuario: true } } },
        },
      },
      orderBy: { nome: "asc" },
    }),
    prisma.atleta.findMany({
      where: { usuario: { ativo: true } },
      include: { usuario: true },
      orderBy: { usuario: { nome: "asc" } },
    }),
  ]);

  return (
    <Pagina>
      <PageHeader titulo="Patrimônio" subtitulo="Bolas, coletes e materiais do clube — e quem está com o quê" />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          {itens.length === 0 && <Vazio mensagem="Nenhum item cadastrado." />}
          <div className="space-y-3">
            {itens.map((item) => {
              const emprestado = item.emprestimos.reduce((s, e) => s + e.quantidade, 0);
              return (
                <div key={item.id} className="card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{item.nome}</div>
                      <div className="text-xs text-muted">
                        {item.categoria} · {item.quantidade} un. · {emprestado} emprestada(s) · {item.quantidade - emprestado} disponíveis
                      </div>
                    </div>
                    <details className="text-right">
                      <summary className="btn btn-outline text-xs cursor-pointer">Emprestar</summary>
                      <form action={registrarEmprestimo} className="flex gap-2 mt-2">
                        <input type="hidden" name="patrimonioId" value={item.id} />
                        <select name="atletaId" required className="input text-xs w-40">
                          {atletas.map((a) => (
                            <option key={a.id} value={a.id}>{a.apelido ?? a.usuario.nome}</option>
                          ))}
                        </select>
                        <input name="quantidade" type="number" min={1} defaultValue={1} className="input w-16 text-xs" />
                        <button className="btn btn-primary text-xs">OK</button>
                      </form>
                    </details>
                  </div>
                  {item.emprestimos.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm border-t border-borda pt-3">
                      {item.emprestimos.map((e) => (
                        <li key={e.id} className="flex items-center justify-between">
                          <span>
                            {e.atleta.apelido ?? e.atleta.usuario.nome} — {e.quantidade} un.
                            <span className="text-xs text-muted ml-1">desde {fmtData(e.retiradoEm)}</span>
                          </span>
                          <form action={devolverEmprestimo}>
                            <input type="hidden" name="emprestimoId" value={e.id} />
                            <button className="btn btn-outline text-xs px-2 py-0.5">Devolveu ✓</button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5 h-fit">
          <h2 className="font-bold mb-3">+ Novo item</h2>
          <form action={criarPatrimonio} className="space-y-3">
            <input name="nome" required placeholder="Ex: Bola Penalty campo" className="input" />
            <select name="categoria" className="input">
              <option value="bola">Bola</option>
              <option value="colete">Colete</option>
              <option value="rede">Rede</option>
              <option value="medicina">Kit medicina</option>
              <option value="outros">Outros</option>
            </select>
            <input name="quantidade" type="number" min={1} defaultValue={1} className="input" />
            <input name="observacoes" placeholder="Observações" className="input" />
            <button className="btn btn-primary w-full">Cadastrar</button>
          </form>
        </div>
      </div>
    </Pagina>
  );
}
