# ⚽ Amigos da Bola FC — ClubManager

Aplicação web para gestão de um clube de futebol amador (campo e futsal): jogos, atletas, presenças com lista de espera, resultados, notas, rankings, mensalidade via PIX, mesa tática, uniformes e muito mais.

## Stack

- **Next.js 16** (App Router, Server Actions) + **TypeScript**
- **Tailwind CSS 4** + **Framer Motion** (animações e mesa tática drag-and-drop)
- **PostgreSQL** + **Prisma**
- Autenticação própria com JWT em cookie httpOnly (`jose` + `bcryptjs`)
- QR Code PIX (BR Code EMV) gerado localmente — sem gateway de pagamento

## Funcionalidades

### Fase 1 — MVP
- Cadastro do clube (identidade, chave PIX, valor/vencimento da mensalidade, regulamento)
- Gestão de funcionários (admins) e atletas (usuários), com papéis `SUPER_ADMIN`, `ADMIN`, `ATLETA`
- Cadastro de jogos (campo/futsal, adversário, local, competição) — **kit de uniforme obrigatório em todo jogo**
- Confirmação de participação pelos atletas
- Resultados, estatísticas individuais (gols, assistências, cartões, gols sofridos)
- Notas dos jogadores (avaliação entre companheiros, 0–10)
- Histórico de resultados + retrospecto por adversário
- Mensalidade via PIX: chave + QR Code + copia-e-cola, atleta informa pagamento, admin confirma

### Fase 2 — Engajamento
- Lista de espera automática quando o jogo lota (promoção automática ao abrir vaga)
- Mural de recados por jogo e mural de avisos do clube
- Rankings: artilheiros, garçons, melhores notas, assiduidade, paredão (goleiros)
- Craque da partida (votação entre os atletas)

### Mesa tática e uniformes
- Mesa tática interativa por jogo: campo ou quadra de futsal, esquemas prontos (4-4-2, 4-3-3, 3-5-2, 1-2-1, 2-2), arraste-e-solte dos jogadores, anotações do técnico
- Gestão de kits: cores (camisa, calção, meião), estoque por tamanho, histórico de uso por jogo

### Fase 3 — Gestão avançada
- Financeiro completo: receitas × despesas, lançamentos por categoria, dashboard
- Competições com aproveitamento e pontos
- Saúde: lesões por atleta, contato de emergência, tipo sanguíneo, convênio
- Patrimônio: materiais do clube e controle de empréstimos (quem está com o quê)

### Fase 4 — Extras
- Badges/conquistas automáticas (10/25/50/100 jogos, gols, craque 3×, paredão)
- Galeria de fotos por jogo (upload até 2MB)

## Rodando localmente

```bash
# 1. Banco de dados
createdb clubmanager

# 2. Configuração
cp .env.example .env   # ajuste DATABASE_URL e AUTH_SECRET

# 3. Dependências e schema
npm install
npx prisma db push

# 4. Dados de demonstração (opcional, recomendado)
npx tsx prisma/seed.ts

# 5. Rodar
npm run dev
```

### Logins de demonstração (seed)

| Perfil | E-mail | Senha |
|---|---|---|
| Super Admin | `admin@amigosdabola.com` | `123456` |
| Atleta | `fabinho@amigos.com` (e outros `@amigos.com`) | `123456` |

## Estrutura

```
prisma/schema.prisma      # modelo de dados completo
prisma/seed.ts            # dados de demonstração
src/lib/                  # auth (JWT), prisma, PIX BR Code, formatação
src/server/               # server actions por domínio + badges + stats
src/components/           # componentes client (mesa tática, forms, nav)
src/app/(app)/            # páginas protegidas
src/app/login/            # login
```
