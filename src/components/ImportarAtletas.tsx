"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { importarAtletas } from "@/server/importar-atletas";

export function ImportarAtletas() {
  const [state, action, pending] = useActionState(importarAtletas, undefined);

  return (
    <details className="card p-5 mb-6">
      <summary className="cursor-pointer font-bold">📥 Cadastrar atletas em lote (Excel)</summary>
      <div className="mt-4 space-y-4">
        <ol className="text-sm text-muted list-decimal list-inside space-y-1">
          <li>
            <a href="/api/atletas/template" className="text-primary font-semibold hover:underline" download>
              Baixe o template Excel aqui
            </a>{" "}
            (aba &quot;Instruções&quot; explica o preenchimento)
          </li>
          <li>Preencha um atleta por linha e apague as linhas de exemplo</li>
          <li>Envie o arquivo preenchido abaixo</li>
        </ol>

        <form action={action} className="flex flex-wrap items-center gap-3">
          <input type="file" name="arquivo" required className="input text-xs w-auto flex-1 min-w-52"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
          <button className="btn btn-primary" disabled={pending}>
            {pending ? "Importando..." : "Importar planilha"}
          </button>
        </form>

        {state?.erro && <p className="text-danger text-sm font-medium">{state.erro}</p>}

        {state?.criados && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 text-sm">
            <p className="font-semibold text-primary">
              ✅ {state.criados.length} atleta(s) importado(s)
              {state.criados.length > 0 && `: ${state.criados.join(", ")}`}
            </p>
            {state.senhaPadrao && (
              <p className="text-accent">
                🔑 Atletas sem senha na planilha receberam a senha padrão{" "}
                <code className="font-bold">{state.senhaPadrao}</code> — oriente cada um a trocá-la (ou redefina no perfil).
              </p>
            )}
            {state.falhas && state.falhas.length > 0 && (
              <div>
                <p className="font-semibold text-danger">⚠️ {state.falhas.length} linha(s) não importada(s):</p>
                <ul className="list-disc list-inside text-muted">
                  {state.falhas.map((f) => (
                    <li key={f.linha}>Linha {f.linha}: {f.motivo}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </details>
  );
}
