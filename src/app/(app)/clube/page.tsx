import { redirect } from "next/navigation";
import { getSessao } from "@/lib/auth";
import { obterClube, salvarClube } from "@/server/clube-actions";
import { Pagina, PageHeader } from "@/components/ui";

export default async function ClubePage() {
  const sessao = (await getSessao())!;
  if (sessao.role === "ATLETA") redirect("/");
  const clube = await obterClube();

  return (
    <Pagina>
      <PageHeader titulo="Clube" subtitulo="Dados institucionais, PIX e mensalidade" />
      <form action={salvarClube} className="space-y-6 max-w-2xl">
        <div className="card p-6 grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 font-bold">🛡️ Identidade</div>
          <div>
            <label className="label">Nome do clube *</label>
            <input name="nome" required defaultValue={clube.nome} className="input" />
          </div>
          <div>
            <label className="label">Apelido</label>
            <input name="apelido" defaultValue={clube.apelido ?? ""} className="input" />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input name="cidade" defaultValue={clube.cidade ?? ""} className="input" />
          </div>
          <div>
            <label className="label">Estado</label>
            <input name="estado" defaultValue={clube.estado ?? ""} className="input" maxLength={2} placeholder="SP" />
          </div>
          <div>
            <label className="label">Fundação</label>
            <input name="fundacao" type="date" defaultValue={clube.fundacao ? clube.fundacao.toISOString().slice(0, 10) : ""} className="input" />
          </div>
        </div>

        <div className="card p-6 grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 font-bold">💠 Conta PIX do clube</div>
          <div>
            <label className="label">Chave PIX</label>
            <input name="pixChave" defaultValue={clube.pixChave ?? ""} className="input" placeholder="CPF, e-mail, telefone ou aleatória" />
          </div>
          <div>
            <label className="label">Tipo da chave</label>
            <select name="pixTipoChave" defaultValue={clube.pixTipoChave ?? ""} className="input">
              <option value="">—</option>
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="aleatoria">Aleatória</option>
            </select>
          </div>
          <div>
            <label className="label">Titular</label>
            <input name="pixTitular" defaultValue={clube.pixTitular ?? ""} className="input" />
          </div>
          <div>
            <label className="label">Banco</label>
            <input name="pixBanco" defaultValue={clube.pixBanco ?? ""} className="input" />
          </div>
          <p className="sm:col-span-2 text-xs text-muted">
            A chave é exibida com QR Code na página de mensalidade dos atletas.
          </p>
        </div>

        <div className="card p-6 grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 font-bold">💸 Mensalidade</div>
          <div>
            <label className="label">Valor (R$)</label>
            <input name="mensalidadeValor" type="number" step="0.01" min={0} defaultValue={Number(clube.mensalidadeValor)} className="input" />
          </div>
          <div>
            <label className="label">Dia do vencimento</label>
            <input name="mensalidadeVencimentoDia" type="number" min={1} max={28} defaultValue={clube.mensalidadeVencimentoDia} className="input" />
          </div>
        </div>

        <div className="card p-6">
          <label className="label">📜 Regulamento interno</label>
          <textarea name="regulamento" rows={6} defaultValue={clube.regulamento ?? ""} className="input" placeholder="Regras de conduta, multas por falta sem aviso, etc." />
        </div>

        <button className="btn btn-primary">Salvar tudo</button>
      </form>
    </Pagina>
  );
}
