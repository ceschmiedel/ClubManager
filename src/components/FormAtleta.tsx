"use client";

import { useActionState } from "react";
import { criarAtleta, editarAtleta } from "@/server/usuarios-actions";
import { POSICOES } from "@/lib/format";

const POS_CAMPO = ["GOLEIRO", "ZAGUEIRO", "LATERAL", "VOLANTE", "MEIA", "ATACANTE"];
const POS_FUTSAL = ["GOLEIRO", "FIXO", "ALA", "PIVO"];

export type AtletaForm = {
  atletaId: string;
  nome: string;
  telefone: string | null;
  apelido: string | null;
  posicao: string;
  posicaoFutsal: string | null;
  numeroCamisa: number | null;
  nascimento: string | null;
  peDominante: string | null;
  tipoSanguineo: string | null;
  convenio: string | null;
  contatoEmergenciaNome: string | null;
  contatoEmergenciaFone: string | null;
  observacoesSaude: string | null;
  isento: boolean;
};

export function FormAtleta({ atleta }: { atleta?: AtletaForm }) {
  const [state, action, pending] = useActionState(atleta ? editarAtleta : criarAtleta, undefined);

  return (
    <form action={action} className="card p-6 space-y-4 max-w-2xl">
      {atleta && <input type="hidden" name="atletaId" value={atleta.atletaId} />}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Nome completo *</label>
          <input name="nome" required className="input" defaultValue={atleta?.nome} />
        </div>
        <div>
          <label className="label">Apelido</label>
          <input name="apelido" className="input" defaultValue={atleta?.apelido ?? ""} />
        </div>
        {!atleta && (
          <>
            <div>
              <label className="label">E-mail (login) *</label>
              <input name="email" type="email" required className="input" />
            </div>
            <div>
              <label className="label">Senha inicial *</label>
              <input name="senha" type="text" required className="input" placeholder="mín. 4 caracteres" />
            </div>
          </>
        )}
        <div>
          <label className="label">Telefone / WhatsApp</label>
          <input name="telefone" className="input" defaultValue={atleta?.telefone ?? ""} />
        </div>
        <div>
          <label className="label">Nascimento</label>
          <input name="nascimento" type="date" className="input" defaultValue={atleta?.nascimento ?? ""} />
        </div>
        <div>
          <label className="label">Posição (campo)</label>
          <select name="posicao" className="input" defaultValue={atleta?.posicao ?? "MEIA"}>
            {POS_CAMPO.map((p) => <option key={p} value={p}>{POSICOES[p]}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Posição (futsal)</label>
          <select name="posicaoFutsal" className="input" defaultValue={atleta?.posicaoFutsal ?? ""}>
            <option value="">Mesma do campo</option>
            {POS_FUTSAL.map((p) => <option key={p} value={p}>{POSICOES[p]}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Nº da camisa</label>
          <input name="numeroCamisa" type="number" min={1} max={99} className="input" defaultValue={atleta?.numeroCamisa ?? ""} />
        </div>
        <div>
          <label className="label">Pé dominante</label>
          <select name="peDominante" className="input" defaultValue={atleta?.peDominante ?? ""}>
            <option value="">—</option>
            <option value="destro">Destro</option>
            <option value="canhoto">Canhoto</option>
            <option value="ambidestro">Ambidestro</option>
          </select>
        </div>
      </div>

      <fieldset className="border border-borda rounded-xl p-4">
        <legend className="text-xs font-bold uppercase tracking-wider text-muted px-2">🩺 Saúde e emergência</legend>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Tipo sanguíneo</label>
            <input name="tipoSanguineo" className="input" placeholder="O+" defaultValue={atleta?.tipoSanguineo ?? ""} />
          </div>
          <div>
            <label className="label">Convênio</label>
            <input name="convenio" className="input" defaultValue={atleta?.convenio ?? ""} />
          </div>
          <div>
            <label className="label">Contato de emergência</label>
            <input name="contatoEmergenciaNome" className="input" defaultValue={atleta?.contatoEmergenciaNome ?? ""} />
          </div>
          <div>
            <label className="label">Telefone de emergência</label>
            <input name="contatoEmergenciaFone" className="input" defaultValue={atleta?.contatoEmergenciaFone ?? ""} />
          </div>
          {atleta && (
            <div className="sm:col-span-2">
              <label className="label">Observações de saúde</label>
              <textarea name="observacoesSaude" rows={2} className="input" defaultValue={atleta?.observacoesSaude ?? ""} />
            </div>
          )}
        </div>
      </fieldset>

      {atleta && (
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="isento" defaultChecked={atleta.isento} className="h-4 w-4 accent-[var(--primary)]" />
          Isento de mensalidade
        </label>
      )}

      {state?.erro && <p className="text-danger text-sm font-medium">{state.erro}</p>}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Salvando..." : atleta ? "Salvar alterações" : "Cadastrar atleta"}
      </button>
    </form>
  );
}
