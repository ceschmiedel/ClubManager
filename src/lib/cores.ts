// Utilitários de cor para o tema dinâmico do clube.
function hexParaRgb(hex: string): [number, number, number] | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbParaHex([r, g, b]: [number, number, number]) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}

export function escurecer(hex: string, fator = 0.2) {
  const rgb = hexParaRgb(hex);
  if (!rgb) return hex;
  return rgbParaHex([rgb[0] * (1 - fator), rgb[1] * (1 - fator), rgb[2] * (1 - fator)] as [number, number, number]);
}

export function clarear(hex: string, fator = 0.25) {
  const rgb = hexParaRgb(hex);
  if (!rgb) return hex;
  return rgbParaHex([
    rgb[0] + (255 - rgb[0]) * fator,
    rgb[1] + (255 - rgb[1]) * fator,
    rgb[2] + (255 - rgb[2]) * fator,
  ] as [number, number, number]);
}

// Texto branco ou escuro conforme a luminância da cor de fundo
export function corDeTexto(hex: string) {
  const rgb = hexParaRgb(hex);
  if (!rgb) return "#ffffff";
  const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return lum > 0.6 ? "#1f2340" : "#ffffff";
}

export function cssTemaClube(corPrimaria: string, corSecundaria?: string | null) {
  const p = hexParaRgb(corPrimaria) ? corPrimaria : "#6049e8";
  const s = corSecundaria && hexParaRgb(corSecundaria) ? corSecundaria : clarear(p, 0.3);
  return `:root{--primary:${p};--primary-2:${s};--primary-dark:${escurecer(p, 0.22)};--primary-contrast:${corDeTexto(p)};}`;
}
