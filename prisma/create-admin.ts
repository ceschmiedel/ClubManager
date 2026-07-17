// Cria o clube e o primeiro usuário Super Admin em um banco vazio (produção).
// Uso:
//   DATABASE_URL="<url>" ADMIN_EMAIL="voce@email.com" ADMIN_SENHA="suasenha" \
//     ADMIN_NOME="Seu Nome" npx tsx prisma/create-admin.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const senha = process.env.ADMIN_SENHA;
  const nome = process.env.ADMIN_NOME?.trim() || "Administrador";

  if (!email || !senha) {
    console.error("Defina ADMIN_EMAIL e ADMIN_SENHA. Exemplo:");
    console.error('  ADMIN_EMAIL="voce@email.com" ADMIN_SENHA="suasenha" npx tsx prisma/create-admin.ts');
    process.exit(1);
  }
  if (senha.length < 6) {
    console.error("A senha precisa ter pelo menos 6 caracteres.");
    process.exit(1);
  }

  if (!(await prisma.clube.findFirst())) {
    await prisma.clube.create({
      data: { nome: "Amigos da Bola FC", apelido: "Amigos da Bola" },
    });
    console.log("Clube criado: Amigos da Bola FC");
  }

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    console.error(`Já existe usuário com o e-mail ${email}. Nada foi alterado.`);
    process.exit(1);
  }

  await prisma.usuario.create({
    data: {
      nome,
      email,
      senhaHash: await bcrypt.hash(senha, 10),
      role: "SUPER_ADMIN",
    },
  });
  console.log(`Super Admin criado: ${nome} <${email}>`);
  console.log("Pronto! Faça login no app e configure o clube em /clube.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
