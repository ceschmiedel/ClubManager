"use client";

import { useActionState, useEffect, useState } from "react";
import { alternarFuncionarioAtleta } from "@/server/usuarios-actions";

export function FuncionarioAtletaToggle({
  usuarioId,
  ehAtleta,
}: {
  usuarioId: string;
  ehAtleta: boolean;
}) {
  const [state, action, pending] = useActionState(alternarFuncionarioAtleta, undefined);
  const [marcado, setMarcado] = useState(ehAtleta);

  // Sincroniza com o servidor: quando o dado real muda ou quando a ação falha
  useEffect(() => setMarcado(ehAtleta), [ehAtleta]);
  useEffect(() => {
    if (state?.erro) setMarcado(ehAtleta);
  }, [state, ehAtleta]);

  return (
    <form action={action}>
      <input type="hidden" name="usuarioId" value={usuarioId} />
      <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          checked={marcado}
          disabled={pending}
          onChange={(e) => {
            setMarcado(e.currentTarget.checked);
            e.currentTarget.form?.requestSubmit();
          }}
          className="h-4 w-4 accent-[var(--primary)]"
        />
        <span className={marcado ? "text-success font-semibold" : "text-muted"}>
          {pending ? "..." : marcado ? "Atleta ⚽" : "Só gestão"}
        </span>
      </label>
      {state?.erro && (
        <p className="text-danger text-xs mt-1 max-w-56">{state.erro}</p>
      )}
    </form>
  );
}
