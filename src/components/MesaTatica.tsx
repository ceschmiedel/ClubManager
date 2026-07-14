"use client";

import { useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { salvarFormacao } from "@/server/tatica-actions";

type Jogador = { atletaId: string; nome: string; numero: number | null; posicao: string };
type Pos = { x: number; y: number };

const ESQUEMAS_CAMPO: Record<string, Pos[]> = {
  "4-4-2": [
    { x: 50, y: 92 }, { x: 15, y: 74 }, { x: 38, y: 78 }, { x: 62, y: 78 }, { x: 85, y: 74 },
    { x: 15, y: 50 }, { x: 38, y: 54 }, { x: 62, y: 54 }, { x: 85, y: 50 },
    { x: 38, y: 24 }, { x: 62, y: 24 },
  ],
  "4-3-3": [
    { x: 50, y: 92 }, { x: 15, y: 74 }, { x: 38, y: 78 }, { x: 62, y: 78 }, { x: 85, y: 74 },
    { x: 30, y: 52 }, { x: 50, y: 58 }, { x: 70, y: 52 },
    { x: 20, y: 26 }, { x: 50, y: 20 }, { x: 80, y: 26 },
  ],
  "3-5-2": [
    { x: 50, y: 92 }, { x: 28, y: 78 }, { x: 50, y: 80 }, { x: 72, y: 78 },
    { x: 10, y: 52 }, { x: 32, y: 56 }, { x: 50, y: 60 }, { x: 68, y: 56 }, { x: 90, y: 52 },
    { x: 40, y: 24 }, { x: 60, y: 24 },
  ],
};

const ESQUEMAS_FUTSAL: Record<string, Pos[]> = {
  "1-2-1 (losango)": [
    { x: 50, y: 90 }, { x: 50, y: 68 }, { x: 22, y: 46 }, { x: 78, y: 46 }, { x: 50, y: 20 },
  ],
  "2-2 (quadrado)": [
    { x: 50, y: 90 }, { x: 28, y: 62 }, { x: 72, y: 62 }, { x: 28, y: 28 }, { x: 72, y: 28 },
  ],
};

function CampoSvg({ futsal }: { futsal: boolean }) {
  return (
    <svg viewBox="0 0 100 140" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <rect x="0" y="0" width="100" height="140" fill={futsal ? "#0e4429" : "#14532d"} />
      {!futsal && (
        <>
          {[0, 20, 40, 60, 80, 100, 120].map((y) => (
            <rect key={y} x="0" y={y} width="100" height="10" fill="#166534" opacity="0.35" />
          ))}
        </>
      )}
      <g stroke="#e6edf7" strokeWidth="0.6" fill="none" opacity="0.8">
        <rect x="2" y="2" width="96" height="136" />
        <line x1="2" y1="70" x2="98" y2="70" />
        <circle cx="50" cy="70" r={futsal ? 8 : 12} />
        <rect x={futsal ? 30 : 22} y="2" width={futsal ? 40 : 56} height={futsal ? 10 : 18} />
        <rect x={futsal ? 30 : 22} y={futsal ? 128 : 120} width={futsal ? 40 : 56} height={futsal ? 10 : 18} />
        {!futsal && <rect x="36" y="2" width="28" height="8" />}
        {!futsal && <rect x="36" y="130" width="28" height="8" />}
      </g>
    </svg>
  );
}

export function MesaTatica({
  jogoId,
  modalidade,
  jogadores,
  inicial,
  esquemaInicial,
  anotacoesIniciais,
  podeEditar,
}: {
  jogoId: string;
  modalidade: "CAMPO" | "FUTSAL";
  jogadores: Jogador[];
  inicial: Record<string, Pos>;
  esquemaInicial: string | null;
  anotacoesIniciais: string | null;
  podeEditar: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [posicoes, setPosicoes] = useState<Record<string, Pos>>(inicial);
  const [esquema, setEsquema] = useState(esquemaInicial ?? "");
  const [anotacoes, setAnotacoes] = useState(anotacoesIniciais ?? "");
  const [salvo, setSalvo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const esquemas = modalidade === "FUTSAL" ? ESQUEMAS_FUTSAL : ESQUEMAS_CAMPO;
  const emCampo = jogadores.filter((j) => posicoes[j.atletaId]);
  const banco = jogadores.filter((j) => !posicoes[j.atletaId]);

  function aplicarEsquema(nome: string) {
    setEsquema(nome);
    const spots = esquemas[nome];
    if (!spots) return;
    const novo: Record<string, Pos> = {};
    // Goleiros primeiro, depois demais na ordem
    const ordenados = [...jogadores].sort(
      (a, b) => Number(b.posicao === "GOLEIRO") - Number(a.posicao === "GOLEIRO")
    );
    ordenados.slice(0, spots.length).forEach((j, i) => (novo[j.atletaId] = spots[i]));
    setPosicoes(novo);
  }

  function aoSoltarChip(atletaId: string, pointX: number, pointY: number) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((pointX - rect.left) / rect.width) * 100;
    const y = ((pointY - rect.top) / rect.height) * 100;
    if (x < -8 || x > 108 || y < -8 || y > 108) {
      // arrastou para fora: volta pro banco
      setPosicoes((p) => {
        const c = { ...p };
        delete c[atletaId];
        return c;
      });
    } else {
      setPosicoes((p) => ({
        ...p,
        [atletaId]: { x: Math.max(3, Math.min(97, x)), y: Math.max(3, Math.min(97, y)) },
      }));
    }
  }

  function entrarEmCampo(atletaId: string) {
    setPosicoes((p) => ({ ...p, [atletaId]: { x: 50, y: 50 } }));
  }

  function salvar() {
    startTransition(async () => {
      await salvarFormacao({
        jogoId,
        esquema: esquema || undefined,
        anotacoes: anotacoes || undefined,
        posicoes: Object.entries(posicoes).map(([atletaId, p]) => ({
          atletaId, x: p.x, y: p.y, titular: true,
        })),
      });
      setSalvo("Formação salva ✓");
      setTimeout(() => setSalvo(null), 2500);
    });
  }

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-6">
      <div>
        {podeEditar && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-muted uppercase">Esquema:</span>
            {Object.keys(esquemas).map((nome) => (
              <button
                key={nome}
                onClick={() => aplicarEsquema(nome)}
                className={`btn px-3 py-1 text-xs ${esquema === nome ? "btn-primary" : "btn-outline"}`}
              >
                {nome}
              </button>
            ))}
          </div>
        )}
        <div
          ref={ref}
          className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden border border-borda select-none"
          style={{ aspectRatio: "100 / 140" }}
        >
          <CampoSvg futsal={modalidade === "FUTSAL"} />
          {emCampo.map((j) => {
            const p = posicoes[j.atletaId];
            return (
              <motion.div
                key={`${j.atletaId}-${Math.round(p.x)}-${Math.round(p.y)}`}
                drag={podeEditar}
                dragMomentum={false}
                onDragEnd={(_, info) => aoSoltarChip(j.atletaId, info.point.x, info.point.y)}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileDrag={{ scale: 1.15, zIndex: 30 }}
                className={`absolute flex flex-col items-center ${podeEditar ? "cursor-grab active:cursor-grabbing" : ""}`}
                style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)", touchAction: "none" }}
              >
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 ${
                  j.posicao === "GOLEIRO"
                    ? "bg-amber-400 text-amber-950 border-amber-200"
                    : "bg-emerald-500 text-emerald-950 border-emerald-200"
                }`}>
                  {j.numero ?? j.nome.slice(0, 2).toUpperCase()}
                </div>
                <div className="text-[10px] font-bold text-white drop-shadow mt-0.5 max-w-16 truncate">
                  {j.nome.split(" ")[0]}
                </div>
              </motion.div>
            );
          })}
        </div>
        {podeEditar && (
          <p className="text-xs text-muted text-center mt-2">
            Arraste os jogadores pelo campo. Arraste para fora para mandar ao banco.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {podeEditar && (
          <div className="card p-4">
            <div className="label">Banco / não posicionados ({banco.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {banco.map((j) => (
                <button
                  key={j.atletaId}
                  onClick={() => entrarEmCampo(j.atletaId)}
                  className="btn btn-outline px-2.5 py-1 text-xs"
                  title="Clique para colocar em campo"
                >
                  {j.numero ? `${j.numero} · ` : ""}{j.nome.split(" ")[0]}
                </button>
              ))}
              {banco.length === 0 && <span className="text-xs text-muted">Todos em campo</span>}
            </div>
          </div>
        )}
        <div className="card p-4">
          <div className="label">Anotações táticas</div>
          {podeEditar ? (
            <textarea
              value={anotacoes}
              onChange={(e) => setAnotacoes(e.target.value)}
              rows={6}
              placeholder="Marcação alta, sair jogando pelo Zé, escanteios curtos..."
              className="input text-sm"
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{anotacoes || "Sem anotações."}</p>
          )}
        </div>
        {podeEditar && (
          <button onClick={salvar} disabled={pending} className="btn btn-primary w-full">
            {pending ? "Salvando..." : salvo ?? "Salvar formação"}
          </button>
        )}
      </div>
    </div>
  );
}
