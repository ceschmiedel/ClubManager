import Link from "next/link";
import { PageTransition } from "./PageTransition";

export function PageHeader({
  titulo,
  subtitulo,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        {subtitulo && <p className="text-muted text-sm mt-0.5">{subtitulo}</p>}
      </div>
      {acao}
    </div>
  );
}

export function Pagina({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}

export function Vazio({ mensagem }: { mensagem: string }) {
  return (
    <div className="card p-10 text-center text-muted text-sm">{mensagem}</div>
  );
}

export function StatCard({
  rotulo,
  valor,
  detalhe,
  cor,
}: {
  rotulo: string;
  valor: React.ReactNode;
  detalhe?: string;
  cor?: string;
}) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted">{rotulo}</div>
      <div className={`text-2xl font-bold mt-1 ${cor ?? ""}`}>{valor}</div>
      {detalhe && <div className="text-xs text-muted mt-0.5">{detalhe}</div>}
    </div>
  );
}

export function LinkVoltar({ href, rotulo }: { href: string; rotulo?: string }) {
  return (
    <Link href={href} className="text-sm text-muted hover:text-primary inline-flex items-center gap-1 mb-4">
      ← {rotulo ?? "Voltar"}
    </Link>
  );
}
