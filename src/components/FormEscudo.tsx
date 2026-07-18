"use client";

import { useActionState } from "react";
import { enviarEscudo } from "@/server/clube-actions";

export function FormEscudo() {
  const [state, action, pending] = useActionState(enviarEscudo, undefined);
  return (
    <form action={action} className="flex flex-wrap items-center gap-3">
      <input type="file" name="escudo" accept="image/*" required className="input text-xs w-auto flex-1 min-w-48" />
      <button className="btn btn-primary text-xs" disabled={pending}>
        {pending ? "Enviando..." : "Enviar escudo"}
      </button>
      {state?.erro && <p className="text-danger text-sm w-full">{state.erro}</p>}
    </form>
  );
}
