CREATE TABLE "FundoBanner" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "nome" TEXT,
  "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FundoBanner_pkey" PRIMARY KEY ("id")
);
