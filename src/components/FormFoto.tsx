"use client";

import { useActionState } from "react";
import { enviarFoto } from "@/server/outros-actions";

export function FormFoto({ jogos }: { jogos: { id: string; rotulo: string }[] }) {
  const [state, action, pending] = useActionState(enviarFoto, undefined);
  return (
    <form action={action} className="card p-4 flex flex-wrap items-end gap-3">
      <div>
        <label className="label">Foto (máx. 2MB)</label>
        <input type="file" name="arquivo" accept="image/*" required className="input text-xs" />
      </div>
      <div className="flex-1 min-w-40">
        <label className="label">Legenda</label>
        <input name="legenda" className="input" placeholder="Opcional" />
      </div>
      <div>
        <label className="label">Jogo</label>
        <select name="jogoId" className="input">
          <option value="">Nenhum</option>
          {jogos.map((j) => <option key={j.id} value={j.id}>{j.rotulo}</option>)}
        </select>
      </div>
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Enviando..." : "Enviar 📸"}
      </button>
      {state?.erro && <p className="text-danger text-sm w-full">{state.erro}</p>}
    </form>
  );
}
