"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export type NavItem = { href: string; rotulo: string; icone: string };

export function EscudoClube({
  escudoUrl,
  tamanho = "h-10 w-10",
}: {
  escudoUrl?: string | null;
  tamanho?: string;
}) {
  if (escudoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={escudoUrl} alt="Escudo do clube" className={`${tamanho} rounded-full object-cover border border-borda bg-white`} />;
  }
  return (
    <div className={`${tamanho} rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-xl`}>
      ⚽
    </div>
  );
}

export function Sidebar({
  itens,
  nome,
  role,
  onLogout,
  clubeNome,
  escudoUrl,
}: {
  itens: NavItem[];
  nome: string;
  role: string;
  onLogout: () => void;
  clubeNome?: string;
  escudoUrl?: string | null;
}) {
  const pathname = usePathname();
  const ativo = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-borda bg-surface/60 backdrop-blur sticky top-0 h-dvh">
      <div className="p-5 flex items-center gap-3 border-b border-borda">
        <EscudoClube escudoUrl={escudoUrl} />
        <div className="min-w-0">
          <div className="font-bold leading-tight truncate">{clubeNome ?? "Meu Clube"}</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {itens.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              ativo(item.href) ? "text-primary" : "text-muted hover:text-foreground hover:bg-surface-2"
            }`}
          >
            {ativo(item.href) && (
              <motion.span
                layoutId="nav-ativo"
                className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/25"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{item.icone}</span>
            <span className="relative z-10">{item.rotulo}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-borda">
        <div className="text-sm font-semibold truncate">{nome}</div>
        <div className="text-xs text-muted mb-2">
          {role === "ATLETA" ? "Atleta" : role === "ADMIN" ? "Administrador" : "Super Admin"}
        </div>
        <button onClick={onLogout} className="btn btn-outline w-full text-xs py-1.5">
          Sair
        </button>
      </div>
    </aside>
  );
}

export function BottomNav({ itens }: { itens: NavItem[] }) {
  const pathname = usePathname();
  const principais = itens.slice(0, 5);
  const ativo = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/90 backdrop-blur border-t border-borda flex">
      {principais.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold ${
            ativo(item.href) ? "text-primary" : "text-muted"
          }`}
        >
          <span className="text-lg leading-none">{item.icone}</span>
          {item.rotulo}
        </Link>
      ))}
    </nav>
  );
}
