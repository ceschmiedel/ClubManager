import { prisma } from "@/lib/prisma";
import { LoginClient } from "@/components/LoginClient";

export default async function LoginPage() {
  const clube = await prisma.clube.findFirst().catch(() => null);
  return (
    <LoginClient
      clubeNome={clube?.apelido ?? clube?.nome ?? "Meu Clube"}
      escudoUrl={clube?.escudoUrl}
    />
  );
}
