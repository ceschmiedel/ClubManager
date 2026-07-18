import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { prisma } from "@/lib/prisma";
import { cssTemaClube } from "@/lib/cores";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Amigos da Bola FC",
  description: "Gestão do clube Amigos da Bola FC",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const clube = await prisma.clube.findFirst().catch(() => null);
  const temaClube =
    clube?.usarCoresClube && clube.corPrimaria
      ? cssTemaClube(clube.corPrimaria, clube.corSecundaria)
      : null;

  return (
    <html lang="pt-BR">
      <body className={`${geist.variable} font-sans antialiased`}>
        {temaClube && <style>{temaClube}</style>}
        {children}
      </body>
    </html>
  );
}
