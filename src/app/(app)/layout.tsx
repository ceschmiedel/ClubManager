import { redirect } from "next/navigation";
import { getSessao } from "@/lib/auth";
import { logout } from "@/server/auth-actions";
import { Sidebar, BottomNav, type NavItem } from "@/components/Nav";
import { MenuMobile } from "@/components/MenuMobile";

const itensAdmin: NavItem[] = [
  { href: "/", rotulo: "Início", icone: "🏠" },
  { href: "/jogos", rotulo: "Jogos", icone: "📅" },
  { href: "/atletas", rotulo: "Atletas", icone: "👥" },
  { href: "/financeiro", rotulo: "Financeiro", icone: "💰" },
  { href: "/rankings", rotulo: "Rankings", icone: "🏆" },
  { href: "/historico", rotulo: "Histórico", icone: "📜" },
  { href: "/uniformes", rotulo: "Uniformes", icone: "👕" },
  { href: "/competicoes", rotulo: "Competições", icone: "🏅" },
  { href: "/saude", rotulo: "Saúde", icone: "🩺" },
  { href: "/patrimonio", rotulo: "Patrimônio", icone: "🎽" },
  { href: "/galeria", rotulo: "Galeria", icone: "📸" },
  { href: "/avisos", rotulo: "Avisos", icone: "📢" },
  { href: "/funcionarios", rotulo: "Funcionários", icone: "🧑‍💼" },
  { href: "/clube", rotulo: "Clube", icone: "🛡️" },
];

const itensAtleta: NavItem[] = [
  { href: "/", rotulo: "Início", icone: "🏠" },
  { href: "/jogos", rotulo: "Jogos", icone: "📅" },
  { href: "/rankings", rotulo: "Rankings", icone: "🏆" },
  { href: "/mensalidade", rotulo: "Mensalidade", icone: "💸" },
  { href: "/historico", rotulo: "Histórico", icone: "📜" },
  { href: "/galeria", rotulo: "Galeria", icone: "📸" },
  { href: "/avisos", rotulo: "Avisos", icone: "📢" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await getSessao();
  if (!sessao) redirect("/login");
  const admin = sessao.role === "ADMIN" || sessao.role === "SUPER_ADMIN";
  const itens = admin ? itensAdmin : itensAtleta;

  return (
    <div className="flex min-h-dvh">
      <Sidebar itens={itens} nome={sessao.nome} role={sessao.role} onLogout={logout} />
      <div className="flex-1 min-w-0 flex flex-col">
        <MenuMobile itens={itens} nome={sessao.nome} onLogout={logout} />
        <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 max-w-6xl w-full mx-auto">
          {children}
        </main>
        <BottomNav itens={itens} />
      </div>
    </div>
  );
}
