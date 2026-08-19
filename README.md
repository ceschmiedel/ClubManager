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
npx prisma migrate deploy

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

> Esses logins só existem depois de rodar `npx tsx prisma/seed.ts` **naquele
> banco**. Um banco recém-criado (ex.: o de produção) não tem nenhum usuário.

## Deploy (Vercel + Neon)

1. Crie um banco Postgres no [Neon](https://neon.tech) e copie a connection string.
2. Na [Vercel](https://vercel.com), importe este repositório do GitHub.
3. Configure as variáveis de ambiente do projeto:
   - `DATABASE_URL` — a connection string **pooled** do Neon (host com `-pooler`, `?sslmode=require`)
   - `DIRECT_URL` — a connection string **direta** do Neon (mesmo valor, sem `-pooler` no host);
     usada apenas pelo `prisma migrate deploy` no build
   - `AUTH_SECRET` — um segredo forte (ex: `openssl rand -base64 32`)
4. Deploy. O script de build já roda `prisma migrate deploy` (aplica as migrations
   no banco) e `prisma generate` automaticamente antes do `next build`.
5. **Crie o primeiro usuário.** O build só aplica as migrations — ele **não** cria
   nenhum usuário. Em um banco novo não existe conta alguma, então o login falha
   com "E-mail ou senha inválidos" até você rodar um dos comandos abaixo:

   ```bash
   # Opção A — dados de demonstração completos (inclui admin@amigosdabola.com / 123456)
   DATABASE_URL="<url do neon>" npx tsx prisma/seed.ts

   # Opção B — apenas o clube + seu Super Admin, sem dados fictícios
   DATABASE_URL="<url do neon>" ADMIN_EMAIL="voce@email.com" \
     ADMIN_SENHA="suasenha" ADMIN_NOME="Seu Nome" npm run db:admin
   ```

## Não consigo entrar

**"E-mail ou senha inválidos"** — a conta não existe nesse banco (o mais comum em
um deploy novo, veja o passo 5 acima) ou a senha é outra. Para redefinir a senha
de um e-mail que já existe, reativar a conta e garantir o papel de Super Admin:

```bash
DATABASE_URL="<url do banco>" ADMIN_EMAIL="admin@amigosdabola.com" \
  ADMIN_SENHA="novasenha" ADMIN_RESET=1 npm run db:admin
```

Sem `ADMIN_RESET=1` o script nunca sobrescreve um usuário existente.

**A página fica recarregando / `ERR_TOO_MANY_REDIRECTS`** — é um cookie de sessão
antigo que deixou de ser válido (normalmente porque o `AUTH_SECRET` mudou ou não
está definido no ambiente). O middleware agora valida o JWT e apaga o cookie
inválido sozinho; se ainda acontecer, limpe os cookies do site no navegador.
Defina `AUTH_SECRET` uma vez e **não troque o valor**, senão todas as sessões
ativas caem.

**"Não foi possível conectar ao banco de dados"** — `DATABASE_URL` errada,
banco fora do ar ou migrations não aplicadas. Confira as variáveis de ambiente e
rode `npx prisma migrate deploy`.

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
