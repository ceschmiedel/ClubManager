import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getSessao } from "@/lib/auth";
import { gerarPayloadPix } from "@/lib/pix";
import { obterClube } from "@/server/clube-actions";
import { fmtMoeda, fmtCompetencia, fmtData } from "@/lib/format";
import { Pagina, PageHeader, Vazio } from "@/components/ui";
import { informarPagamento } from "@/server/financeiro-actions";
import { CopiarPix } from "@/components/CopiarPix";

export default async function MensalidadePage() {
  const sessao = (await getSessao())!;
  if (!sessao.atletaId) redirect("/financeiro");
  const clube = await obterClube();

  const pagamentos = await prisma.pagamento.findMany({
    where: { atletaId: sessao.atletaId },
    orderBy: { competencia: "desc" },
  });
  const emAberto = pagamentos.filter((p) => p.status === "PENDENTE");

  let qrDataUrl: string | null = null;
  let payload: string | null = null;
  if (clube.pixChave) {
    payload = gerarPayloadPix({
      chave: clube.pixChave,
      nome: clube.pixTitular ?? clube.nome,
      cidade: clube.cidade ?? "BRASIL",
      valor: emAberto.length ? Number(emAberto[0].valor) : Number(clube.mensalidadeValor),
    });
    qrDataUrl = await QRCode.toDataURL(payload, { width: 280, margin: 1, color: { dark: "#0b1220", light: "#ffffff" } });
  }

  return (
    <Pagina>
      <PageHeader titulo="Mensalidade" subtitulo={`${fmtMoeda(Number(clube.mensalidadeValor))} por mês · vence dia ${clube.mensalidadeVencimentoDia}`} />

      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        <div className="card p-6 text-center h-fit">
          <h2 className="font-bold mb-1">Pague via PIX</h2>
          {clube.pixChave ? (
            <>
              <p className="text-xs text-muted mb-4">
                {clube.pixTitular ?? clube.nome}{clube.pixBanco ? ` · ${clube.pixBanco}` : ""}
              </p>
              {qrDataUrl && (
                <img src={qrDataUrl} alt="QR Code PIX" className="mx-auto rounded-xl mb-4 bg-white p-2" />
              )}
              <div className="text-left mb-3">
                <div className="label">Chave PIX ({clube.pixTipoChave ?? "chave"})</div>
                <CopiarPix valor={clube.pixChave} rotulo="Copiar chave" />
              </div>
              {payload && (
                <div className="text-left">
                  <div className="label">PIX copia e cola</div>
                  <CopiarPix valor={payload} rotulo="Copiar código" truncar />
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">O clube ainda não cadastrou a chave PIX. Fale com um administrador.</p>
          )}
        </div>

        <div>
          <h2 className="font-bold mb-3">Minhas mensalidades</h2>
          {pagamentos.length === 0 && <Vazio mensagem="Nenhuma cobrança gerada para você ainda." />}
          <div className="space-y-2">
            {pagamentos.map((p) => (
              <div key={p.id} className="card p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold">{fmtCompetencia(p.competencia)}</div>
                  <div className="text-sm text-muted">{fmtMoeda(Number(p.valor))}{p.pagoEm && ` · pago em ${fmtData(p.pagoEm)}`}</div>
                </div>
                <div className="flex items-center gap-3">
                  {p.status === "PAGO" && <span className="badge bg-success/15 text-success">Pago ✓</span>}
                  {p.status === "ISENTO" && <span className="badge bg-surface-2 text-muted">Isento</span>}
                  {p.status === "AGUARDANDO_CONFIRMACAO" && <span className="badge bg-accent/15 text-accent">Aguardando confirmação</span>}
                  {p.status === "PENDENTE" && (
                    <form action={informarPagamento} className="flex gap-2">
                      <input type="hidden" name="pagamentoId" value={p.id} />
                      <input name="comprovanteInfo" placeholder="Obs. do comprovante (opcional)" className="input w-52 text-xs" />
                      <button className="btn btn-primary text-xs">Já paguei 💸</button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Pagina>
  );
}
