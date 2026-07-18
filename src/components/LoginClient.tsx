"use client";

import { useState, useActionState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { login, cadastrarComConvite } from "@/server/auth-actions";

export function LoginClient({
  clubeNome,
  escudoUrl,
}: {
  clubeNome: string;
  escudoUrl?: string | null;
}) {
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [loginState, loginAction, loginPending] = useActionState(login, undefined);
  const [cadState, cadAction, cadPending] = useActionState(cadastrarComConvite, undefined);

  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="card w-full max-w-sm p-8"
      >
        <div className="text-center mb-6">
          <motion.div
            initial={{ rotate: -12, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", delay: 0.15 }}
            className="mx-auto mb-4 h-16 w-16"
          >
            {escudoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={escudoUrl} alt="Escudo do clube" className="h-16 w-16 rounded-full object-cover border border-borda bg-white shadow" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-3xl">⚽</div>
            )}
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight">{clubeNome}</h1>
          <p className="text-muted text-sm mt-1">Gestão do clube</p>
        </div>

        <div className="flex rounded-lg bg-surface-2 border border-borda p-1 mb-6 text-sm font-semibold">
          {(["entrar", "cadastrar"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`relative flex-1 py-1.5 rounded-md transition-colors ${
                modo === m ? "text-primary" : "text-muted hover:text-foreground"
              }`}
            >
              {modo === m && (
                <motion.span
                  layoutId="aba-login"
                  className="absolute inset-0 rounded-md bg-primary/10 border border-primary/25"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{m === "entrar" ? "Entrar" : "Cadastrar"}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {modo === "entrar" ? (
            <motion.form
              key="entrar"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              action={loginAction}
              className="space-y-4"
            >
              <div>
                <label className="label" htmlFor="email">E-mail</label>
                <input id="email" name="email" type="email" required className="input" placeholder="voce@exemplo.com" />
              </div>
              <div>
                <label className="label" htmlFor="senha">Senha</label>
                <input id="senha" name="senha" type="password" required className="input" placeholder="••••••••" />
              </div>
              {loginState?.erro && (
                <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-danger text-sm font-medium">
                  {loginState.erro}
                </motion.p>
              )}
              <button className="btn btn-primary w-full" disabled={loginPending}>
                {loginPending ? "Entrando..." : "Entrar"}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="cadastrar"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              action={cadAction}
              className="space-y-4"
            >
              <div>
                <label className="label" htmlFor="codigo">Código de convite do clube</label>
                <input id="codigo" name="codigo" required className="input uppercase tracking-widest" placeholder="BOLA-XXXXX" />
                <p className="text-[11px] text-muted mt-1">Peça o código a um administrador do clube.</p>
              </div>
              <div>
                <label className="label" htmlFor="cad-nome">Nome completo</label>
                <input id="cad-nome" name="nome" required className="input" placeholder="Seu nome" />
              </div>
              <div>
                <label className="label" htmlFor="cad-email">E-mail</label>
                <input id="cad-email" name="email" type="email" required className="input" placeholder="voce@exemplo.com" />
              </div>
              <div>
                <label className="label" htmlFor="cad-senha">Senha (mín. 6 caracteres)</label>
                <input id="cad-senha" name="senha" type="password" required minLength={6} className="input" placeholder="••••••••" />
              </div>
              {cadState?.erro && (
                <motion.p initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="text-danger text-sm font-medium">
                  {cadState.erro}
                </motion.p>
              )}
              <button className="btn btn-primary w-full" disabled={cadPending}>
                {cadPending ? "Criando conta..." : "Entrar no clube ⚽"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
