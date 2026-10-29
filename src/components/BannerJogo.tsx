"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Montserrat } from "next/font/google";
import {
  salvarBannerFundo, enviarEscudoAdversario, removerEscudoAdversario,
  enviarFundoBanner, excluirFundoBanner,
} from "@/server/banner-actions";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600", "700", "800", "900"] });
const FONT = montserrat.style.fontFamily;

const PRESETS = [
  { id: "1", rotulo: "Bola no gramado" },
  { id: "2", rotulo: "Estádio" },
  { id: "3", rotulo: "Comemoração" },
  { id: "4", rotulo: "Urbano" },
  { id: "5", rotulo: "Confronto" },
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

function quebrarLinhas(ctx: CanvasRenderingContext2D, texto: string, maxLarg: number, maxLinhas: number): string[] {
  const palavras = texto.split(/\s+/);
  const linhas: string[] = [];
  let atual = "";
  let i = 0;
  while (i < palavras.length) {
    const palavra = palavras[i];
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (ctx.measureText(teste).width > maxLarg && atual) {
      linhas.push(atual);
      atual = "";
      if (linhas.length === maxLinhas) break;
    } else {
      atual = teste;
      i++;
    }
  }
  if (linhas.length < maxLinhas && atual) linhas.push(atual);

  if (i < palavras.length) {
    let ultima = linhas[maxLinhas - 1] ?? "";
    while (ctx.measureText(`${ultima}…`).width > maxLarg && ultima.length > 4) {
      ultima = ultima.slice(0, -1);
    }
    linhas[maxLinhas - 1] = `${ultima.trim()}…`;
  }
  return linhas;
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

      // Garante que a fonte esteja carregada antes de desenhar no canvas
      try {
        await Promise.all([
          document.fonts.load(`800 100px ${FONT}`),
          document.fonts.load(`700 100px ${FONT}`),
          document.fonts.load(`600 100px ${FONT}`),
        ]);
      } catch { /* fallback para a fonte do sistema */ }

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

      const comSombra = (blur: number, off: number) => {
        ctx.shadowColor = "rgba(0,0,0,0.55)";
        ctx.shadowBlur = blur;
        ctx.shadowOffsetY = off;
      };
      const semSombra = () => {
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
      };

      // Título: nome da competição (grande, em destaque, no topo)
      const tituloFont = Math.round(W * 0.072);
      ctx.font = `800 ${tituloFont}px ${FONT}`;
      ctx.fillStyle = "#ffffff";
      comSombra(W * 0.018, W * 0.004);
      const tituloLinhas = quebrarLinhas(ctx, props.competicao, W * 0.9, 2);
      const tituloY0 = H * 0.085 + tituloFont / 2;
      tituloLinhas.forEach((linha, i) => {
        ctx.fillText(linha, W / 2, tituloY0 + i * tituloFont * 1.08);
      });
      const tituloBottom = tituloY0 + (tituloLinhas.length - 1) * tituloFont * 1.08 + tituloFont / 2;

      // Local do jogo (em destaque, logo abaixo do título)
      const localFont = Math.round(W * 0.037);
      ctx.font = `600 ${localFont}px ${FONT}`;
      ctx.fillStyle = "#e9edfb";
      const localLinhas = quebrarLinhas(ctx, props.local, W * 0.84, 2);
      const localY0 = tituloBottom + localFont * 1.2;
      localLinhas.forEach((linha, i) => {
        ctx.fillText(linha, W / 2, localY0 + i * localFont * 1.25);
      });
      const localBottom = localY0 + (localLinhas.length - 1) * localFont * 1.25 + localFont / 2;
      semSombra();

      // Escudos + X (centralizados horizontalmente)
      const d = Math.min(W * 0.30, H * 0.26);
      const cy = Math.max(H * 0.48, localBottom + d / 2 + H * 0.055);
      const gap = W * 0.21;
      const cxE = W / 2 - gap, cxA = W / 2 + gap;

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

      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${Math.round(W * 0.07)}px ${FONT}`;
      comSombra(W * 0.012, W * 0.003);
      ctx.fillText("X", W / 2, cy + 2);
      semSombra();

      // Nomes dos times (abaixo dos escudos, em até 2 linhas)
      const nomeFont = Math.round(W * 0.040);
      ctx.fillStyle = "#ffffff";
      ctx.font = `700 ${nomeFont}px ${FONT}`;
      comSombra(W * 0.012, W * 0.003);
      const nomeBaseY = cy + d / 2 + nomeFont * 1.25;
      const desenhaNome = (t: string, cx: number) => {
        const linhas = quebrarLinhas(ctx, t, W * 0.44, 2);
        linhas.forEach((l, i) => ctx.fillText(l, cx, nomeBaseY + i * nomeFont * 1.1));
      };
      desenhaNome(props.clubeNome, cxE);
      desenhaNome(props.adversarioNome, cxA);
      semSombra();

      // Data e horário (grande, próximo à base)
      const dataFont = Math.round(W * 0.056);
      ctx.fillStyle = "#ffffff";
      ctx.font = `800 ${dataFont}px ${FONT}`;
      comSombra(W * 0.02, W * 0.004);
      const dataTxt = `${props.data} • ${props.hora}`;
      const dataLinhas = quebrarLinhas(ctx, dataTxt, W * 0.9, 2);
      const dataBottom = H * 0.93;
      const dataTop = dataBottom - (dataLinhas.length - 1) * dataFont * 1.15 - dataFont / 2;
      dataLinhas.forEach((l, i) => ctx.fillText(l, W / 2, dataTop + i * dataFont * 1.15));
      semSombra();
    })();
    return () => { cancelado = true; };
  }, [
    fundoSrc, W, H,
    props.clubeEscudo, props.adversarioEscudo, props.clubeNome, props.adversarioNome,
    props.competicao, props.local, props.data, props.hora,
  ]);

  function baixar() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `banner-${formato}-${props.adversarioNome.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, "image/png");
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
      <div className="flex justify-center min-w-0 w-full">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block w-auto h-auto max-w-full max-h-[60vh] sm:max-h-[70vh] rounded-2xl border border-borda shadow"
          style={{ aspectRatio: `${W} / ${H}` }}
        />
      </div>
      <div className="space-y-4 min-w-0">
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
