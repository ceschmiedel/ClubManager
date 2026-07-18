"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { EscudoClube, type NavItem } from "./Nav";

export function MenuMobile({
  itens,
  nome,
  onLogout,
  clubeNome,
  escudoUrl,
}: {
  itens: NavItem[];
  nome: string;
  onLogout: () => void;
  clubeNome?: string;
  escudoUrl?: string | null;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-surface/90 backdrop-blur border-b border-borda">
        <div className="flex items-center gap-2 font-bold min-w-0">
          <EscudoClube escudoUrl={escudoUrl} tamanho="h-8 w-8" />
          <span className="truncate">{clubeNome ?? "Meu Clube"}</span>
        </div>
        <button
          aria-label="Menu"
          onClick={() => setAberto(true)}
          className="btn btn-outline px-3 py-1.5"
        >
          ☰
        </button>
      </header>
      <AnimatePresence>
        {aberto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAberto(false)}
              className="fixed inset-0 z-50 bg-black/60"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 34 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-surface border-l border-borda p-4 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="font-bold">{nome}</div>
                <button onClick={() => setAberto(false)} className="text-muted text-xl px-2">✕</button>
              </div>
              <nav className="space-y-1">
                {itens.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setAberto(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:text-foreground hover:bg-surface-2"
                  >
                    <span>{item.icone}</span> {item.rotulo}
                  </Link>
                ))}
              </nav>
              <button onClick={onLogout} className="btn btn-outline w-full mt-6">Sair</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
