import { redirect } from "next/navigation";
import { getSessao } from "@/lib/auth";
import { Pagina, PageHeader, LinkVoltar } from "@/components/ui";
import { FormAtleta } from "@/components/FormAtleta";

export default async function NovoAtletaPage() {
  const sessao = (await getSessao())!;
  if (sessao.role === "ATLETA") redirect("/");
  return (
    <Pagina>
      <LinkVoltar href="/atletas" rotulo="Atletas" />
      <PageHeader titulo="Novo atleta" subtitulo="O atleta usa o e-mail e a senha para entrar no app" />
      <FormAtleta />
    </Pagina>
  );
}
