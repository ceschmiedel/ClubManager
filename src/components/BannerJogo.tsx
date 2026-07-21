"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  salvarBannerFundo, enviarEscudoAdversario, removerEscudoAdversario,
  enviarFundoBanner, excluirFundoBanner,
} from "@/server/banner-actions";

const PRESETS = [
  { id: "1", rotulo: "Gramado" },
  { id: "2", rotulo: "Estádio" },
  { id: "3", rotulo: "Pôr do sol" },
  { id: "4", rotulo: "Urbano" },
];
const FORMATOS = [
  { id: "feed", rotulo: "Feed 4:5", w: 1080, h: 1350 },
  { id: "story", rotulo: "Stories 9:16", w: 1080, h: 1920 },
  { id: "paisagem", rotulo: "Paisagem", w: 1200, h: 675 },
];
const GENERICO = "/escudo-generico.svg";

type FundoCustom = { id: string; url: string; nome: string | null };

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
  fundosCustom: FundoCustom[];
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
  const [formato, setFormato] = useState("feed");
  const [uploadState, uploadAction, uploadPending] = useActionState(enviarEscudoAdversario, undefined);
  const [fundoState, fundoUpAction, fundoUpPending] = useActionState(enviarFundoBanner, undefined);

  // Resolve a URL do fundo escolhido (preset ou custom)
  const fundoSrc = (() => {
    if (PRESETS.some((p) => p.id === fundo)) return `/banners/${fundo}.jpg`;
    return props.fundosCustom.find((f) => f.id === fundo)?.url ?? `/banners/1.jpg`;
  })();

  const fmt = FORMATOS.find((f) => f.id === formato)!;
  const W = fmt.w, H = fmt.h;

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const [bg, escC, escA] = await Promise.all([
        carregarImg(fundoSrc),
        carregarImg(props.clubeEscudo || GENERICO),
        carregarImg(props.adversarioEscudo || GENERICO),
      ]);
      if (cancelado) return;

      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, W, H);
      if (bg) {
        const r = Math.max(W / bg.width, H / bg.height);
        const nw = bg.width * r, nh = bg.height * r;
        ctx.drawImage(bg, (W - nw) / 2, (H - nh) / 2, nw, nh);
      }

      // Overlay para legibilidade
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "rgba(8,12,22,0.60)");
      grad.addColorStop(0.45, "rgba(8,12,22,0.30)");
      grad.addColorStop(1, "rgba(8,12,22,0.88)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Pílula: competição
      const pillFont = Math.round(W * 0.03);
      ctx.font = `700 ${pillFont}px Arial, sans-serif`;
      const rotulo = props.competicao.toUpperCase();
      const larg = ctx.measureText(rotulo).width + pillFont * 2.2;
      const pillH = pillFont * 1.9;
      ctx.fillStyle = "rgba(96,73,232,0.92)";
      roundRect(ctx, (W - larg) / 2, H * 0.06, larg, pillH, pillH / 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(rotulo, W / 2, H * 0.06 + pillH / 2 + 1);

      // Escudos + X
      const d = Math.min(W * 0.26, H * 0.30);
      const cy = H * 0.42;
      const cxE = W * 0.29, cxA = W * 0.71;

      const desenhaEscudo = (img: HTMLImageElement | null, cx: number) => {
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = d * 0.12;
        ctx.beginPath();
        ctx.arc(cx, cy, d / 2 + d * 0.05, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.10)";
        ctx.fill();
        ctx.restore();
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = "#fff";
        ctx.fillRect(cx - d / 2, cy - d / 2, d, d);
        if (img) {
          const rr = Math.max(d / img.width, d / img.height);
          const nw = img.width * rr, nh = img.height * rr;
          ctx.drawImage(img, cx - nw / 2, cy - nh / 2, nw, nh);
        }
        ctx.restore();
      };
      desenhaEscudo(escC, cxE);
      desenhaEscudo(escA, cxA);

      ctx.fillStyle = "#facc15";
      ctx.font = `900 ${Math.round(W * 0.075)}px Arial, sans-serif`;
      ctx.fillText("X", W / 2, cy + 2);

      // Nomes
      ctx.fillStyle = "#fff";
      const nomeFont = Math.round(W * 0.038);
      ctx.font = `800 ${nomeFont}px Arial, sans-serif`;
      const maxNome = W * 0.40;
      const nome = (t: string, cx: number) => {
        let s = t;
        while (ctx.measureText(s.toUpperCase()).width > maxNome && s.length > 4) s = s.slice(0, -1);
        if (s !== t) s = s.trim() + "…";
        ctx.fillText(s.toUpperCase(), cx, cy + d / 2 + nomeFont * 1.3);
      };
      nome(props.clubeNome, cxE);
      nome(props.adversarioNome, cxA);

      // Barra inferior: Data / Horário / Local
      const barraH = H * 0.16;
      const barraY = H - barraH;
      ctx.fillStyle = "rgba(8,12,22,0.78)";
      ctx.fillRect(0, barraY, W, barraH);
      ctx.fillStyle = "rgba(96,73,232,1)";
      ctx.fillRect(0, barraY, W, Math.max(4, H * 0.006));

      const tituloFont = Math.round(W * 0.019);
      const valorFont = Math.round(W * 0.028);
      const col = (titulo: string, valor: string, cx: number, maxLarg: number) => {
        ctx.fillStyle = "#a9b4cc";
        ctx.font = `700 ${tituloFont}px Arial, sans-serif`;
        ctx.fillText(titulo, cx, barraY + barraH * 0.34);
        ctx.fillStyle = "#fff";
        ctx.font = `800 ${valorFont}px Arial, sans-serif`;
        let s = valor;
        while (ctx.measureText(s).width > maxLarg && s.length > 4) s = s.slice(0, -1);
        if (s !== valor) s = s.trim() + "…";
        ctx.fillText(s, cx, barraY + barraH * 0.66);
      };
      col("DATA", props.data, W / 6, W * 0.28);
      col("HORÁRIO", props.hora, W / 2, W * 0.28);
      col("LOCAL", props.local, (5 * W) / 6, W * 0.30);
    })();
    return () => { cancelado = true; };
  }, [fundoSrc, W, H, props]);

  function baixar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `banner-${formato}-${props.adversarioNome.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6">
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="rounded-2xl border border-borda shadow max-h-[70vh] w-auto"
          style={{ aspectRatio: `${W} / ${H}` }}
        />
      </div>
      <div className="space-y-4">
        <div>
          <div className="label">Formato</div>
          <div className="flex flex-wrap gap-1.5">
            {FORMATOS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormato(f.id)}
                className={`btn px-3 py-1 text-xs ${formato === f.id ? "btn-primary" : "btn-outline"}`}
              >
                {f.rotulo}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="label">Imagem de fundo</div>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFundo(f.id)}
                className={`relative rounded-lg overflow-hidden border-2 transition-colors ${fundo === f.id ? "border-primary" : "border-borda"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/banners/${f.id}.jpg`} alt={f.rotulo} className="w-full h-14 object-cover" />
                <span className="block text-[10px] py-0.5 text-center bg-surface-2">{f.rotulo}</span>
              </button>
            ))}
            {props.fundosCustom.map((f) => (
              <div key={f.id} className={`relative rounded-lg overflow-hidden border-2 ${fundo === f.id ? "border-primary" : "border-borda"}`}>
                <button type="button" onClick={() => setFundo(f.id)} className="block w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt={f.nome ?? "Fundo"} className="w-full h-14 object-cover" />
                  <span className="block text-[10px] py-0.5 text-center bg-surface-2 truncate px-1">{f.nome ?? "Meu fundo"}</span>
                </button>
                <form action={excluirFundoBanner} className="absolute top-1 right-1">
                  <input type="hidden" name="fundoId" value={f.id} />
                  <input type="hidden" name="jogoId" value={props.jogoId} />
                  <button className="bg-black/60 text-white rounded-full w-5 h-5 text-xs leading-none">×</button>
                </form>
              </div>
            ))}
          </div>

          <form action={fundoUpAction} className="mt-2 space-y-1.5">
            <input type="hidden" name="jogoId" value={props.jogoId} />
            <input type="file" name="fundo" accept="image/*" required className="input text-xs" />
            <button className="btn btn-outline w-full text-xs" disabled={fundoUpPending}>
              {fundoUpPending ? "Enviando..." : "⬆️ Subir minha imagem de fundo"}
            </button>
            {fundoState?.erro && <p className="text-danger text-xs">{fundoState.erro}</p>}
          </form>

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
        <p className="text-[11px] text-muted">{W}×{H}px — {fmt.rotulo}. Ideal para postar no Instagram e no grupo.</p>
      </div>
    </div>
  );
}
