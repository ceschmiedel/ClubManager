"use client";

import { useActionState } from "react";
import { motion } from "framer-motion";
import { login } from "@/server/auth-actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="card w-full max-w-sm p-8"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ rotate: -12, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", delay: 0.15 }}
            className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-3xl"
          >
            ⚽
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight">
            Amigos da Bola <span className="text-primary">FC</span>
          </h1>
          <p className="text-muted text-sm mt-1">Gestão do clube</p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label className="label" htmlFor="email">E-mail</label>
            <input id="email" name="email" type="email" required className="input" placeholder="voce@exemplo.com" />
          </div>
          <div>
            <label className="label" htmlFor="senha">Senha</label>
            <input id="senha" name="senha" type="password" required className="input" placeholder="••••••••" />
          </div>
          {state?.erro && (
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-danger text-sm font-medium"
            >
              {state.erro}
            </motion.p>
          )}
          <button className="btn btn-primary w-full" disabled={pending}>
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
