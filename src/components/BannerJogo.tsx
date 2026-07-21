"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { salvarBannerFundo, enviarEscudoAdversario, removerEscudoAdversario } from "@/server/banner-actions";

const FUNDOS = [
  { id: "1", rotulo: "Gramado noturno" },
  { id: "2", rotulo: "Estádio" },
  { id: "3", rotulo: "Pôr do sol" },
  { id: "4", rotulo: "Urbano" },
];
const GENERICO = "/escudo-generico.svg";

type Props = {
  jogoId: string;
  clubeNome: string;
  clubeEscudo: string | null;
  adversarioId: string | null;
  adversarioNome: string;
  adversarioEscudo: string | null;
  data: string;
  hora: string;
  local: string;
  competicao: string;
  emCasa: boolean;
  fundoInicial: string | null;
};

function carregarImg(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function coverDraw(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const r = Math.max(w / img.width, h / img.height);
  const nw = img.width * r, nh = img.height * r;
  ctx.drawImage(img, (w - nw) / 2, (h - nh) / 2, nw, nh);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function BannerJogo(props: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fundo, setFundo] = useState(props.fundoInicial ?? "1");
  const [uploadState, uploadAction, uploadPending] = useActionState(enviarEscudoAdversario, undefined);

  const W = 1200, H = 675;

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const [bg, escC, escA] = await Promise.all([
        carregarImg(`/banners/${fundo}.jpg`),
        carregarImg(props.clubeEscudo || GENERICO),
        carregarImg(props.adversarioEscudo || GENERICO),
      ]);
      if (cancelado) return;

      // Fundo
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, W, H);
      if (bg) coverDraw(ctx, bg, W, H);

      // Overlay para legibilidade
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "rgba(8,12,22,0.55)");
      grad.addColorStop(0.5, "rgba(8,12,22,0.35)");
      grad.addColorStop(1, "rgba(8,12,22,0.85)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Pílula superior: competição/amistoso
      ctx.font = "700 26px Arial, sans-serif";
      const rotulo = props.competicao.toUpperCase();
      const larg = ctx.measureText(rotulo).width + 56;
      ctx.fillStyle = "rgba(96,73,232,0.92)";
      roundRect(ctx, (W - larg) / 2, 40, larg, 50, 25);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(rotulo, W / 2, 66);

      // Escudos + X central
      const escLado = 190;
      const yEsc = 175;
      const xClube = W / 2 - 300 - escLado / 2;
      const xAdv = W / 2 + 300 - escLado / 2;

      const desenhaEscudo = (img: HTMLImageElement | null, cx: number) => {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(cx, yEsc + escLado / 2, escLado / 2 + 10, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        ctx.fill();
        ctx.restore();
        if (img) {
          const r = escLado / 2;
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, yEsc + r, r, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.fillStyle = "#fff";
          ctx.fillRect(cx - r, yEsc, escLado, escLado);
          const rr = Math.max(escLado / img.width, escLado / img.height);
          const nw = img.width * rr, nh = img.height * rr;
          ctx.drawImage(img, cx - nw / 2, yEsc + r - nh / 2, nw, nh);
          ctx.restore();
        }
      };
      desenhaEscudo(escC, xClube + escLado / 2);
      desenhaEscudo(escA, xAdv + escLado / 2);

      // X central
      ctx.fillStyle = "#facc15";
      ctx.font = "900 90px Arial, sans-serif";
      ctx.fillText("X", W / 2, yEsc + escLado / 2 + 4);

      // Nomes
      ctx.fillStyle = "#fff";
      ctx.font = "800 40px Arial, sans-serif";
      const nome = (t: string, cx: number) => {
        let s = t;
        while (ctx.measureText(s).width > 360 && s.length > 4) s = s.slice(0, -1);
        if (s !== t) s = s.trim() + "…";
        ctx.fillText(s.toUpperCase(), cx, yEsc + escLado + 55);
      };
      nome(props.clubeNome, xClube + escLado / 2);
      nome(props.adversarioNome, xAdv + escLado / 2);

      // Barra inferior com Data / Horário / Local
      const barraY = H - 130;
      ctx.fillStyle = "rgba(8,12,22,0.72)";
      ctx.fillRect(0, barraY, W, 130);
      ctx.fillStyle = "rgba(96,73,232,1)";
      ctx.fillRect(0, barraY, W, 5);

      const col = (titulo: string, valor: string, cx: number, maxLarg: number) => {
        ctx.textAlign = "center";
        ctx.fillStyle = "#8fa3c0";
        ctx.font = "700 20px Arial, sans-serif";
        ctx.fillText(titulo, cx, barraY + 42);
        ctx.fillStyle = "#fff";
        ctx.font = "800 30px Arial, sans-serif";
        let s = valor;
        while (ctx.measureText(s).width > maxLarg && s.length > 4) s = s.slice(0, -1);
        if (s !== valor) s = s.trim() + "…";
        ctx.fillText(s, cx, barraY + 84);
      };
      col("DATA", props.data, W / 6, 320);
      col("HORÁRIO", props.hora, W / 2, 320);
      col("LOCAL", props.local, (5 * W) / 6, 360);
    })();
    return () => { cancelado = true; };
  }, [fundo, props]);

  function baixar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `banner-${props.adversarioNome.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-6">
      <div>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full rounded-2xl border border-borda shadow"
        />
      </div>
      <div className="space-y-4">
        <div>
          <div className="label">Imagem de fundo</div>
          <div className="grid grid-cols-2 gap-2">
            {FUNDOS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFundo(f.id)}
                className={`relative rounded-lg overflow-hidden border-2 transition-colors ${fundo === f.id ? "border-primary" : "border-borda"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/banners/${f.id}.jpg`} alt={f.rotulo} className="w-full h-16 object-cover" />
                <span className="block text-[10px] py-1 text-center bg-surface-2">{f.rotulo}</span>
              </button>
            ))}
          </div>
          <form action={salvarBannerFundo} className="mt-2">
            <input type="hidden" name="jogoId" value={props.jogoId} />
            <input type="hidden" name="bannerFundo" value={fundo} />
            <button className="btn btn-outline w-full text-xs">Salvar fundo escolhido</button>
          </form>
        </div>

        {props.adversarioId && (
          <div className="card p-3">
            <div className="label">Escudo do adversário</div>
            {props.adversarioEscudo ? (
              <div className="flex items-center gap-2 mb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={props.adversarioEscudo} alt="Escudo" className="h-10 w-10 rounded-full object-cover bg-white border border-borda" />
                <form action={removerEscudoAdversario}>
                  <input type="hidden" name="adversarioId" value={props.adversarioId} />
                  <input type="hidden" name="jogoId" value={props.jogoId} />
                  <button className="text-xs text-muted hover:text-danger">Remover</button>
                </form>
              </div>
            ) : (
              <p className="text-[11px] text-muted mb-2">Sem escudo — usando o genérico. Envie o do adversário abaixo.</p>
            )}
            <form action={uploadAction} className="space-y-2">
              <input type="hidden" name="adversarioId" value={props.adversarioId} />
              <input type="file" name="escudo" accept="image/*" required className="input text-xs" />
              <button className="btn btn-primary w-full text-xs" disabled={uploadPending}>
                {uploadPending ? "Enviando..." : "Enviar escudo"}
              </button>
              {uploadState?.erro && <p className="text-danger text-xs">{uploadState.erro}</p>}
            </form>
          </div>
        )}

        <button onClick={baixar} className="btn btn-primary w-full">⬇️ Baixar banner (PNG)</button>
        <p className="text-[11px] text-muted">Ideal para compartilhar no grupo do WhatsApp. 1200×675px.</p>
      </div>
    </div>
  );
}
