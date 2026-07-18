"use client";

import { useActionState } from "react";
import { criarFuncionario } from "@/server/usuarios-actions";

export function FormFuncionario() {
  const [state, action, pending] = useActionState(criarFuncionario, undefined);
  return (
    <form action={action} className="card p-6 grid sm:grid-cols-2 gap-4 max-w-2xl">
      <div>
        <label className="label">Nome *</label>
        <input name="nome" required className="input" />
      </div>
      <div>
        <label className="label">E-mail *</label>
        <input name="email" type="email" required className="input" />
      </div>
      <div>
        <label className="label">Senha *</label>
        <input name="senha" required className="input" />
      </div>
      <div>
        <label className="label">Telefone</label>
        <input name="telefone" className="input" />
      </div>
      <div>
        <label className="label">Papel</label>
        <select name="role" className="input">
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>
      <div className="flex items-end">
        <label className="flex items-center gap-2 text-sm font-medium pb-2.5 cursor-pointer">
          <input type="checkbox" name="tambemAtleta" className="h-4 w-4 accent-[var(--primary)]" />
          ⚽ Também é atleta do clube
        </label>
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Criando..." : "Criar funcionário"}
        </button>
        {state?.erro && <p className="text-danger text-sm font-medium">{state.erro}</p>}
      </div>
    </form>
  );
}
