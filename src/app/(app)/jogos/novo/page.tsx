import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { Pagina, PageHeader, LinkVoltar } from "@/components/ui";
import { FormJogo } from "@/components/FormJogo";
import { criarAdversario, criarLocal } from "@/server/outros-actions";

export default async function NovoJogoPage() {
  const sessao = (await getSessao())!;
  if (sessao.role === "ATLETA") redirect("/jogos");

  const [adversarios, locais, competicoes, kits] = await Promise.all([
    prisma.adversario.findMany({ orderBy: { nome: "asc" } }),
    prisma.local.findMany({ orderBy: { nome: "asc" } }),
    prisma.competicao.findMany({ orderBy: { nome: "asc" } }),
    prisma.kit.findMany({ where: { ativo: true }, orderBy: { nome: "asc" } }),
  ]);

  return (
    <Pagina>
      <LinkVoltar href="/jogos" rotulo="Jogos" />
      <PageHeader titulo="Novo jogo" subtitulo="O kit de uniforme é obrigatório em todo jogo" />
      {kits.length === 0 ? (
        <div className="card p-6 max-w-2xl">
          <p className="text-sm mb-3">
            ⚠️ Nenhum kit de uniforme cadastrado. Cadastre um kit antes de criar o jogo.
          </p>
          <Link href="/uniformes" className="btn btn-primary">Cadastrar uniforme</Link>
        </div>
      ) : (
        <FormJogo
          adversarios={adversarios}
          locais={locais}
          competicoes={competicoes}
          kits={kits.map((k) => ({ id: k.id, nome: k.nome, corPrimaria: k.corPrimaria, tipo: k.tipo }))}
        />
      )}

      <div className="grid sm:grid-cols-2 gap-4 mt-8 max-w-2xl">
        <details className="card p-4">
          <summary className="cursor-pointer font-semibold text-sm">+ Cadastrar adversário rápido</summary>
          <form action={criarAdversario} className="space-y-3 mt-3">
            <input name="nome" placeholder="Nome do time" required className="input" />
            <input name="corCamisa" placeholder="Cor da camisa deles" className="input" />
            <input name="cidade" placeholder="Cidade" className="input" />
            <button className="btn btn-outline w-full">Salvar adversário</button>
          </form>
        </details>
        <details className="card p-4">
          <summary className="cursor-pointer font-semibold text-sm">+ Cadastrar local rápido</summary>
          <form action={criarLocal} className="space-y-3 mt-3">
            <input name="nome" placeholder="Nome do campo/quadra" required className="input" />
            <input name="endereco" placeholder="Endereço" className="input" />
            <select name="modalidade" className="input">
              <option value="CAMPO">Campo</option>
              <option value="FUTSAL">Quadra (futsal)</option>
            </select>
            <input name="valorAluguel" placeholder="Valor do aluguel (R$)" className="input" />
            <button className="btn btn-outline w-full">Salvar local</button>
          </form>
        </details>
      </div>
    </Pagina>
  );
}
