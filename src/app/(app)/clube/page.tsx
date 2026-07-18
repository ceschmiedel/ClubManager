import { redirect } from "next/navigation";
import { getSessao } from "@/lib/auth";
import { obterClube, salvarClube, gerarCodigoConvite, desativarCodigoConvite, salvarIdentidadeVisual, removerEscudo } from "@/server/clube-actions";
import { Pagina, PageHeader } from "@/components/ui";
import { CopiarPix } from "@/components/CopiarPix";
import { FormEscudo } from "@/components/FormEscudo";

export default async function ClubePage() {
  const sessao = (await getSessao())!;
  if (sessao.role === "ATLETA") redirect("/");
  const clube = await obterClube();

  return (
    <Pagina>
      <PageHeader titulo="Clube" subtitulo="Dados institucionais, PIX e mensalidade" />

      <div className="card p-6 max-w-2xl mb-6">
        <div className="font-bold mb-4">🎨 Identidade visual</div>
        <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-start mb-5">
          <div className="flex flex-col items-center gap-2">
            {clube.escudoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={clube.escudoUrl} alt="Escudo do clube" className="h-24 w-24 rounded-full object-cover border border-borda bg-white shadow" />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary/10 border border-borda flex items-center justify-center text-4xl">⚽</div>
            )}
            {clube.escudoUrl && (
              <form action={removerEscudo}>
                <button className="text-xs text-muted hover:text-danger">Remover escudo</button>
              </form>
            )}
          </div>
          <div>
            <div className="label">Símbolo / escudo do clube (máx. 1MB)</div>
            <FormEscudo />
            <p className="text-[11px] text-muted mt-2">
              O escudo aparece na tela de login, no menu lateral e no topo do app.
            </p>
          </div>
        </div>

        <form action={salvarIdentidadeVisual} className="border-t border-borda pt-5">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Cor principal do clube</label>
              <input type="color" name="corPrimaria" defaultValue={clube.corPrimaria} className="input h-11 p-1" />
            </div>
            <div>
              <label className="label">Cor secundária</label>
              <input type="color" name="corSecundaria" defaultValue={clube.corSecundaria} className="input h-11 p-1" />
            </div>
          </div>
          <div className="label">Tema da aplicação</div>
          <div className="flex flex-col gap-2 mb-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="tema" value="padrao" defaultChecked={!clube.usarCoresClube} className="accent-[var(--primary)]" />
              Cores padrão do app <span className="inline-flex gap-1 ml-1"><span className="h-4 w-4 rounded-full" style={{ background: "#6049e8" }} /><span className="h-4 w-4 rounded-full" style={{ background: "#8b5cf6" }} /></span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="tema" value="clube" defaultChecked={clube.usarCoresClube} className="accent-[var(--primary)]" />
              Cores do clube <span className="inline-flex gap-1 ml-1"><span className="h-4 w-4 rounded-full border border-borda" style={{ background: clube.corPrimaria }} /><span className="h-4 w-4 rounded-full border border-borda" style={{ background: clube.corSecundaria }} /></span>
            </label>
          </div>
          <button className="btn btn-primary">Aplicar identidade visual</button>
        </form>
      </div>

      <div className="card p-6 max-w-2xl mb-6">
        <div className="font-bold mb-1">🎟️ Código de convite</div>
        <p className="text-xs text-muted mb-4">
          Compartilhe este código com os atletas: com ele, cada um cria a própria conta
          na tela inicial do app (aba &quot;Cadastrar&quot;) e já entra no clube.
        </p>
        {clube.codigoConvite ? (
          <div className="space-y-3">
            <CopiarPix valor={clube.codigoConvite} rotulo="Copiar código" />
            <div className="flex gap-2">
              <form action={gerarCodigoConvite}>
                <button className="btn btn-outline text-xs">Gerar novo código</button>
              </form>
              <form action={desativarCodigoConvite}>
                <button className="btn btn-danger text-xs">Desativar convites</button>
              </form>
            </div>
            <p className="text-[11px] text-muted">
              Gerar um novo código invalida o anterior. Desativar impede novos cadastros até gerar outro.
            </p>
          </div>
        ) : (
          <form action={gerarCodigoConvite}>
            <button className="btn btn-primary">Gerar código de convite</button>
          </form>
        )}
      </div>

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
