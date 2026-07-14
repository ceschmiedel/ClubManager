"use client";

import { useActionState } from "react";
import { criarJogo, editarJogo } from "@/server/jogos-actions";

type Opcao = { id: string; nome: string };
type KitOpcao = Opcao & { corPrimaria: string; tipo: string };

export function FormJogo({
  jogo,
  adversarios,
  locais,
  competicoes,
  kits,
}: {
  jogo?: {
    id: string;
    dataHora: string;
    modalidade: string;
    adversarioId: string | null;
    localId: string | null;
    competicaoId: string | null;
    kitId: string;
    maxJogadores: number;
    emCasa: boolean;
    observacoes: string | null;
  };
  adversarios: Opcao[];
  locais: Opcao[];
  competicoes: Opcao[];
  kits: KitOpcao[];
}) {
  const [state, action, pending] = useActionState(jogo ? editarJogo : criarJogo, undefined);

  return (
    <form action={action} className="card p-6 space-y-4 max-w-2xl">
      {jogo && <input type="hidden" name="jogoId" value={jogo.id} />}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Data e hora *</label>
          <input type="datetime-local" name="dataHora" required className="input" defaultValue={jogo?.dataHora} />
        </div>
        <div>
          <label className="label">Modalidade</label>
          <select name="modalidade" className="input" defaultValue={jogo?.modalidade ?? "CAMPO"}>
            <option value="CAMPO">Futebol de campo</option>
            <option value="FUTSAL">Futsal</option>
          </select>
        </div>
        <div>
          <label className="label">Adversário</label>
          <select name="adversarioId" className="input" defaultValue={jogo?.adversarioId ?? ""}>
            <option value="">A definir</option>
            {adversarios.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Local</label>
          <select name="localId" className="input" defaultValue={jogo?.localId ?? ""}>
            <option value="">A definir</option>
            {locais.map((l) => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Competição</label>
          <select name="competicaoId" className="input" defaultValue={jogo?.competicaoId ?? ""}>
            <option value="">Amistoso</option>
            {competicoes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Kit de jogo * (obrigatório)</label>
          <select name="kitId" required className="input" defaultValue={jogo?.kitId ?? ""}>
            <option value="">Escolha o uniforme...</option>
            {kits.map((k) => (
              <option key={k.id} value={k.id}>{k.nome} ({k.tipo.toLowerCase()})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Máx. de jogadores (lista de espera acima disso)</label>
          <input type="number" name="maxJogadores" min={5} max={40} className="input" defaultValue={jogo?.maxJogadores ?? 22} />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <input type="checkbox" id="emCasa" name="emCasa" defaultChecked={jogo?.emCasa ?? true} className="h-4 w-4 accent-[var(--primary)]" />
          <label htmlFor="emCasa" className="text-sm font-medium">Jogo em casa</label>
        </div>
      </div>
      <div>
        <label className="label">Observações (ponto de encontro, combinados...)</label>
        <textarea name="observacoes" rows={2} className="input" defaultValue={jogo?.observacoes ?? ""} />
      </div>
      {state?.erro && <p className="text-danger text-sm font-medium">{state.erro}</p>}
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Salvando..." : jogo ? "Salvar alterações" : "Criar jogo"}
      </button>
    </form>
  );
}
