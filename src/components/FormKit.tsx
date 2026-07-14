"use client";

import { useActionState } from "react";
import { salvarKit } from "@/server/uniformes-actions";

export function FormKit({ kit }: {
  kit?: {
    id: string; nome: string; tipo: string; corPrimaria: string;
    corSecundaria: string | null; corCalcao: string | null; corMeiao: string | null;
    fornecedor: string | null; ano: number | null; observacoes: string | null;
  };
}) {
  const [state, action, pending] = useActionState(salvarKit, undefined);
  return (
    <form action={action} className="grid sm:grid-cols-2 gap-4">
      {kit && <input type="hidden" name="kitId" value={kit.id} />}
      <div>
        <label className="label">Nome do kit *</label>
        <input name="nome" required className="input" placeholder="Camisa titular verde" defaultValue={kit?.nome} />
      </div>
      <div>
        <label className="label">Tipo</label>
        <select name="tipo" className="input" defaultValue={kit?.tipo ?? "TITULAR"}>
          <option value="TITULAR">Titular</option>
          <option value="RESERVA">Reserva</option>
          <option value="GOLEIRO">Goleiro</option>
          <option value="TREINO">Treino</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-4">
        <div>
          <label className="label">Cor camisa *</label>
          <input name="corPrimaria" type="color" className="input h-10 p-1" defaultValue={kit?.corPrimaria ?? "#16a34a"} />
        </div>
        <div>
          <label className="label">Cor detalhe</label>
          <input name="corSecundaria" type="color" className="input h-10 p-1" defaultValue={kit?.corSecundaria ?? "#ffffff"} />
        </div>
        <div>
          <label className="label">Cor calção</label>
          <input name="corCalcao" type="color" className="input h-10 p-1" defaultValue={kit?.corCalcao ?? "#0f172a"} />
        </div>
        <div>
          <label className="label">Cor meião</label>
          <input name="corMeiao" type="color" className="input h-10 p-1" defaultValue={kit?.corMeiao ?? "#16a34a"} />
        </div>
      </div>
      <div>
        <label className="label">Fornecedor</label>
        <input name="fornecedor" className="input" defaultValue={kit?.fornecedor ?? ""} />
      </div>
      <div>
        <label className="label">Ano</label>
        <input name="ano" type="number" className="input" defaultValue={kit?.ano ?? ""} />
      </div>
      <div className="sm:col-span-2">
        <label className="label">Observações</label>
        <input name="observacoes" className="input" defaultValue={kit?.observacoes ?? ""} />
      </div>
      {state?.erro && <p className="text-danger text-sm sm:col-span-2">{state.erro}</p>}
      <button className="btn btn-primary sm:col-span-2" disabled={pending}>
        {pending ? "Salvando..." : kit ? "Salvar kit" : "Cadastrar kit"}
      </button>
    </form>
  );
}
