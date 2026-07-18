import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { Pagina, PageHeader, Vazio } from "@/components/ui";
import { FormFuncionario } from "@/components/FormFuncionario";
import { FuncionarioAtletaToggle } from "@/components/FuncionarioAtletaToggle";
import { alternarAtivoUsuario } from "@/server/usuarios-actions";

export default async function FuncionariosPage() {
  const sessao = (await getSessao())!;
  if (sessao.role === "ATLETA") redirect("/");

  const funcionarios = await prisma.usuario.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    include: { atleta: true },
    orderBy: { nome: "asc" },
  });

  return (
    <Pagina>
      <PageHeader
        titulo="Funcionários"
        subtitulo="Administradores do clube — quem também joga pode ser marcado como atleta"
      />
      {funcionarios.length === 0 && <Vazio mensagem="Nenhum funcionário." />}
      <div className="card overflow-x-auto mb-6">
        <table className="tabela">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Atleta</th><th>Status</th><th /></tr></thead>
          <tbody>
            {funcionarios.map((f) => (
              <tr key={f.id}>
                <td className="font-medium">
                  {f.atleta ? (
                    <Link href={`/atletas/${f.atleta.id}`} className="hover:text-primary">{f.nome}</Link>
                  ) : (
                    f.nome
                  )}
                </td>
                <td>{f.email}</td>
                <td>{f.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}</td>
                <td>
                  <FuncionarioAtletaToggle usuarioId={f.id} ehAtleta={!!f.atleta} />
                </td>
                <td>{f.ativo ? <span className="badge bg-success/15 text-success">Ativo</span> : <span className="badge bg-danger/15 text-danger">Inativo</span>}</td>
                <td>
                  {f.id !== sessao.sub && (
                    <form action={alternarAtivoUsuario}>
                      <input type="hidden" name="usuarioId" value={f.id} />
                      <button className="btn btn-outline px-2 py-1 text-xs">
                        {f.ativo ? "Desativar" : "Reativar"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted mb-6 max-w-2xl">
        Funcionário marcado como atleta confirma presença nos jogos, entra nas estatísticas,
        recebe cobrança de mensalidade e aparece na página Atletas — sem perder o acesso de gestão.
        Complete o perfil (posição, camisa) clicando no nome.
      </p>
      <h2 className="font-bold mb-3">Novo funcionário</h2>
      <FormFuncionario />
    </Pagina>
  );
}
