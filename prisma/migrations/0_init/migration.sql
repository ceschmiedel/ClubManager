-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ATLETA');

-- CreateEnum
CREATE TYPE "Posicao" AS ENUM ('GOLEIRO', 'ZAGUEIRO', 'LATERAL', 'VOLANTE', 'MEIA', 'ATACANTE', 'FIXO', 'ALA', 'PIVO');

-- CreateEnum
CREATE TYPE "Modalidade" AS ENUM ('CAMPO', 'FUTSAL');

-- CreateEnum
CREATE TYPE "StatusJogo" AS ENUM ('AGENDADO', 'ENCERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusConfirmacao" AS ENUM ('CONFIRMADO', 'LISTA_ESPERA', 'RECUSADO');

-- CreateEnum
CREATE TYPE "TipoKit" AS ENUM ('TITULAR', 'RESERVA', 'GOLEIRO', 'TREINO');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'AGUARDANDO_CONFIRMACAO', 'PAGO', 'ISENTO');

-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('RECEITA', 'DESPESA');

-- CreateTable
CREATE TABLE "Clube" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "apelido" TEXT,
    "fundacao" TIMESTAMP(3),
    "escudoUrl" TEXT,
    "corPrimaria" TEXT NOT NULL DEFAULT '#16a34a',
    "corSecundaria" TEXT NOT NULL DEFAULT '#0f172a',
    "cidade" TEXT,
    "estado" TEXT,
    "pixChave" TEXT,
    "pixTipoChave" TEXT,
    "pixTitular" TEXT,
    "pixBanco" TEXT,
    "mensalidadeValor" DECIMAL(10,2) NOT NULL DEFAULT 50,
    "mensalidadeVencimentoDia" INTEGER NOT NULL DEFAULT 10,
    "regulamento" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clube_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ATLETA',
    "telefone" TEXT,
    "avatarUrl" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Atleta" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "apelido" TEXT,
    "nascimento" TIMESTAMP(3),
    "posicao" "Posicao" NOT NULL DEFAULT 'MEIA',
    "posicaoFutsal" "Posicao",
    "numeroCamisa" INTEGER,
    "peDominante" TEXT,
    "alturaCm" INTEGER,
    "pesoKg" INTEGER,
    "tipoSanguineo" TEXT,
    "convenio" TEXT,
    "contatoEmergenciaNome" TEXT,
    "contatoEmergenciaFone" TEXT,
    "observacoesSaude" TEXT,
    "socioDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isento" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Atleta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adversario" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "corCamisa" TEXT,
    "cidade" TEXT,
    "contato" TEXT,

    CONSTRAINT "Adversario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Local" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "modalidade" "Modalidade" NOT NULL DEFAULT 'CAMPO',
    "valorAluguel" DECIMAL(10,2),

    CONSTRAINT "Local_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competicao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "temporada" TEXT,
    "descricao" TEXT,

    CONSTRAINT "Competicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kit" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoKit" NOT NULL DEFAULT 'TITULAR',
    "corPrimaria" TEXT NOT NULL,
    "corSecundaria" TEXT,
    "corCalcao" TEXT,
    "corMeiao" TEXT,
    "fornecedor" TEXT,
    "ano" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,

    CONSTRAINT "Kit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PecaKit" (
    "id" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "tamanho" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PecaKit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jogo" (
    "id" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "modalidade" "Modalidade" NOT NULL DEFAULT 'CAMPO',
    "status" "StatusJogo" NOT NULL DEFAULT 'AGENDADO',
    "adversarioId" TEXT,
    "localId" TEXT,
    "competicaoId" TEXT,
    "kitId" TEXT NOT NULL,
    "maxJogadores" INTEGER NOT NULL DEFAULT 22,
    "emCasa" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "golsPro" INTEGER,
    "golsContra" INTEGER,
    "encerradoEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Jogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Confirmacao" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "status" "StatusConfirmacao" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Confirmacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participacao" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT true,
    "gols" INTEGER NOT NULL DEFAULT 0,
    "assistencias" INTEGER NOT NULL DEFAULT 0,
    "cartaoAmarelo" INTEGER NOT NULL DEFAULT 0,
    "cartaoVermelho" INTEGER NOT NULL DEFAULT 0,
    "golsSofridos" INTEGER,
    "minutos" INTEGER,

    CONSTRAINT "Participacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotaJogador" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "avaliadoId" TEXT NOT NULL,
    "avaliadorId" TEXT NOT NULL,
    "nota" DECIMAL(3,1) NOT NULL,

    CONSTRAINT "NotaJogador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VotoCraque" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "votadoId" TEXT NOT NULL,
    "votanteId" TEXT NOT NULL,

    CONSTRAINT "VotoCraque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComentarioJogo" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComentarioJogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Aviso" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "fixado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Aviso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formacao" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT NOT NULL,
    "esquema" TEXT,
    "anotacoes" TEXT,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Formacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PosicaoTatica" (
    "id" TEXT NOT NULL,
    "formacaoId" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "titular" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PosicaoTatica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE',
    "pagoEm" TIMESTAMP(3),
    "confirmadoPor" TEXT,
    "comprovanteInfo" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lancamento" (
    "id" TEXT NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lancamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesao" (
    "id" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataRetorno" TIMESTAMP(3),
    "ativa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Lesao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patrimonio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "observacoes" TEXT,

    CONSTRAINT "Patrimonio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmprestimoPatrimonio" (
    "id" TEXT NOT NULL,
    "patrimonioId" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "retiradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "devolvidoEm" TIMESTAMP(3),

    CONSTRAINT "EmprestimoPatrimonio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BadgeAtleta" (
    "id" TEXT NOT NULL,
    "atletaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "rotulo" TEXT NOT NULL,
    "ganhoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BadgeAtleta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Foto" (
    "id" TEXT NOT NULL,
    "jogoId" TEXT,
    "url" TEXT NOT NULL,
    "legenda" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Foto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Atleta_usuarioId_key" ON "Atleta"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Confirmacao_jogoId_atletaId_key" ON "Confirmacao"("jogoId", "atletaId");

-- CreateIndex
CREATE UNIQUE INDEX "Participacao_jogoId_atletaId_key" ON "Participacao"("jogoId", "atletaId");

-- CreateIndex
CREATE UNIQUE INDEX "NotaJogador_jogoId_avaliadoId_avaliadorId_key" ON "NotaJogador"("jogoId", "avaliadoId", "avaliadorId");

-- CreateIndex
CREATE UNIQUE INDEX "VotoCraque_jogoId_votanteId_key" ON "VotoCraque"("jogoId", "votanteId");

-- CreateIndex
CREATE UNIQUE INDEX "Formacao_jogoId_key" ON "Formacao"("jogoId");

-- CreateIndex
CREATE UNIQUE INDEX "PosicaoTatica_formacaoId_atletaId_key" ON "PosicaoTatica"("formacaoId", "atletaId");

-- CreateIndex
CREATE UNIQUE INDEX "Pagamento_atletaId_competencia_key" ON "Pagamento"("atletaId", "competencia");

-- CreateIndex
CREATE UNIQUE INDEX "BadgeAtleta_atletaId_codigo_key" ON "BadgeAtleta"("atletaId", "codigo");

-- AddForeignKey
ALTER TABLE "Atleta" ADD CONSTRAINT "Atleta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PecaKit" ADD CONSTRAINT "PecaKit_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_adversarioId_fkey" FOREIGN KEY ("adversarioId") REFERENCES "Adversario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_localId_fkey" FOREIGN KEY ("localId") REFERENCES "Local"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_competicaoId_fkey" FOREIGN KEY ("competicaoId") REFERENCES "Competicao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_kitId_fkey" FOREIGN KEY ("kitId") REFERENCES "Kit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Confirmacao" ADD CONSTRAINT "Confirmacao_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Confirmacao" ADD CONSTRAINT "Confirmacao_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participacao" ADD CONSTRAINT "Participacao_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participacao" ADD CONSTRAINT "Participacao_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaJogador" ADD CONSTRAINT "NotaJogador_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaJogador" ADD CONSTRAINT "NotaJogador_avaliadoId_fkey" FOREIGN KEY ("avaliadoId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotaJogador" ADD CONSTRAINT "NotaJogador_avaliadorId_fkey" FOREIGN KEY ("avaliadorId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotoCraque" ADD CONSTRAINT "VotoCraque_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotoCraque" ADD CONSTRAINT "VotoCraque_votadoId_fkey" FOREIGN KEY ("votadoId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VotoCraque" ADD CONSTRAINT "VotoCraque_votanteId_fkey" FOREIGN KEY ("votanteId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioJogo" ADD CONSTRAINT "ComentarioJogo_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioJogo" ADD CONSTRAINT "ComentarioJogo_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Aviso" ADD CONSTRAINT "Aviso_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Formacao" ADD CONSTRAINT "Formacao_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosicaoTatica" ADD CONSTRAINT "PosicaoTatica_formacaoId_fkey" FOREIGN KEY ("formacaoId") REFERENCES "Formacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PosicaoTatica" ADD CONSTRAINT "PosicaoTatica_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesao" ADD CONSTRAINT "Lesao_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmprestimoPatrimonio" ADD CONSTRAINT "EmprestimoPatrimonio_patrimonioId_fkey" FOREIGN KEY ("patrimonioId") REFERENCES "Patrimonio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmprestimoPatrimonio" ADD CONSTRAINT "EmprestimoPatrimonio_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BadgeAtleta" ADD CONSTRAINT "BadgeAtleta_atletaId_fkey" FOREIGN KEY ("atletaId") REFERENCES "Atleta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Foto" ADD CONSTRAINT "Foto_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

