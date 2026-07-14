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
        {state?.erro && <p className="text-danger text-sm font-medium mr-3">{state.erro}</p>}
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Criando..." : "Criar funcionário"}
        </button>
      </div>
    </form>
  );
}
