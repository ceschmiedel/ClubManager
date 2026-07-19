ALTER TYPE "Posicao" ADD VALUE IF NOT EXISTS 'LATERAL_DIREITO';
ALTER TYPE "Posicao" ADD VALUE IF NOT EXISTS 'LATERAL_ESQUERDO';
ALTER TABLE "Atleta" ADD COLUMN "posicoes" "Posicao"[] NOT NULL DEFAULT ARRAY[]::"Posicao"[];
UPDATE "Atleta" SET "posicoes" = ARRAY["posicao"] WHERE "posicoes" = '{}';
