"use client";

import { useState } from "react";

export function CopiarPix({ valor, rotulo, truncar }: { valor: string; rotulo: string; truncar?: boolean }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className={`input text-xs flex-1 ${truncar ? "truncate" : "break-all"}`}>{valor}</code>
      <button
        onClick={async () => {
          await navigator.clipboard.writeText(valor);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        }}
        className="btn btn-outline text-xs shrink-0"
      >
        {copiado ? "Copiado ✓" : rotulo}
      </button>
    </div>
  );
}
