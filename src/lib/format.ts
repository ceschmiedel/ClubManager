export function fmtData(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function fmtDataHora(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtMoeda(v: number | string | null | undefined) {
  if (v === null || v === undefined) return "—";
  return Number(v).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function competenciaAtual(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function fmtCompetencia(c: string) {
  const [ano, mes] = c.split("-");
  const nomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return `${nomes[Number(mes) - 1]}/${ano}`;
}

export const POSICOES: Record<string, string> = {
  GOLEIRO: "Goleiro",
  ZAGUEIRO: "Zagueiro",
  LATERAL: "Lateral",
  LATERAL_DIREITO: "Lateral Direito",
  LATERAL_ESQUERDO: "Lateral Esquerdo",
  VOLANTE: "Volante",
  MEIA: "Meia",
  ATACANTE: "Atacante",
  FIXO: "Fixo (futsal)",
  ALA: "Ala (futsal)",
  PIVO: "Pivô (futsal)",
};

// Ordem canônica das posições de campo (a primeira marcada vira a principal)
export const POS_CAMPO_OPCOES = [
  "GOLEIRO", "ZAGUEIRO", "LATERAL_DIREITO", "LATERAL_ESQUERDO",
  "VOLANTE", "MEIA", "ATACANTE",
] as const;

export function rotuloPosicoes(posicoes: string[], fallback?: string) {
  const lista = posicoes.length ? posicoes : fallback ? [fallback] : [];
  return lista.map((p) => POSICOES[p] ?? p).join(" · ") || "—";
}

export const CATEGORIAS_LANCAMENTO = [
  "mensalidade", "aluguel", "arbitragem", "material",
  "uniforme", "churrasco", "outros",
];
