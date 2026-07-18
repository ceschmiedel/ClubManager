import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSessao } from "@/lib/auth";

export async function GET() {
  const sessao = await getSessao();
  if (!sessao || sessao.role === "ATLETA") {
    return NextResponse.json({ erro: "Acesso restrito" }, { status: 403 });
  }

  const cabecalho = [
    "Nome*", "Email*", "Senha (opcional)", "Apelido", "Posição",
    "Nº camisa", "Telefone", "Nascimento (dd/mm/aaaa)",
    "Tipo sanguíneo", "Contato emergência", "Tel. emergência",
  ];
  const exemplos = [
    ["João da Silva", "joao@email.com", "", "Joãozinho", "Meia", 10, "(11) 99999-0000", "15/03/1980", "O+", "Maria da Silva", "(11) 98888-0000"],
    ["Pedro Souza", "pedro@email.com", "senha123", "Pedrão", "Goleiro", 1, "", "02/11/1975", "", "", ""],
  ];

  const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...exemplos]);
  ws["!cols"] = [22, 28, 16, 14, 12, 9, 18, 22, 13, 20, 18].map((w) => ({ wch: w }));

  const instrucoes = XLSX.utils.aoa_to_sheet([
    ["Como preencher"],
    [""],
    ["• Apague as duas linhas de exemplo antes de importar."],
    ["• Campos com * são obrigatórios (Nome e Email)."],
    ["• Senha vazia = o atleta recebe a senha padrão informada no resultado da importação."],
    ["• Posições aceitas: Goleiro, Zagueiro, Lateral, Volante, Meia, Atacante."],
    ["• Posição vazia = Meia."],
    ["• Nascimento no formato dd/mm/aaaa (ou como data do Excel)."],
    ["• E-mails repetidos (na planilha ou já cadastrados) são ignorados e listados no resultado."],
  ]);
  instrucoes["!cols"] = [{ wch: 90 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Atletas");
  XLSX.utils.book_append_sheet(wb, instrucoes, "Instruções");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-atletas.xlsx"',
    },
  });
}
