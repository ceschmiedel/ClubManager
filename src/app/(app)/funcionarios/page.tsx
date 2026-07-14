import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { Pagina, PageHeader, Vazio } from "@/components/ui";
import { FormFuncionario } from "@/components/FormFuncionario";
import { alternarAtivoUsuario } from "@/server/usuarios-actions";

export default async function FuncionariosPage() {
  const sessao = (await getSessao())!;
  if (sessao.role === "ATLETA") redirect("/");

  const funcionarios = await prisma.usuario.findMany({
    where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    orderBy: { nome: "asc" },
  });

  return (
    <Pagina>
      <PageHeader titulo="Funcionários" subtitulo="Administradores do clube" />
      {funcionarios.length === 0 && <Vazio mensagem="Nenhum funcionário." />}
      <div className="card overflow-x-auto mb-6">
        <table className="tabela">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Status</th><th /></tr></thead>
          <tbody>
            {funcionarios.map((f) => (
              <tr key={f.id}>
                <td className="font-medium">{f.nome}</td>
                <td>{f.email}</td>
                <td>{f.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}</td>
                <td>{f.ativo ? <span className="badge bg-primary/15 text-primary">Ativo</span> : <span className="badge bg-danger/15 text-danger">Inativo</span>}</td>
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
      <h2 className="font-bold mb-3">Novo funcionário</h2>
      <FormFuncionario />
    </Pagina>
  );
}
