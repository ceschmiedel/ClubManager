import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senha = await bcrypt.hash("123456", 10);

  const clube = await prisma.clube.upsert({
    where: { id: (await prisma.clube.findFirst())?.id ?? "novo" },
    update: {},
    create: {
      nome: "Amigos da Bola FC",
      apelido: "Amigos da Bola",
      cidade: "São Paulo",
      estado: "SP",
      pixChave: "amigosdabola@exemplo.com.br",
      pixTipoChave: "email",
      pixTitular: "Amigos da Bola FC",
      pixBanco: "Banco do Brasil",
      mensalidadeValor: 60,
      mensalidadeVencimentoDia: 10,
      regulamento: "1. Confirme presença até sexta-feira.\n2. Falta sem aviso: multa de R$ 10.\n3. Respeito acima de tudo — somos amigos!",
    },
  });
  console.log("Clube:", clube.nome);

  // Admin
  await prisma.usuario.upsert({
    where: { email: "admin@amigosdabola.com" },
    update: {},
    create: {
      nome: "Carlos Eduardo",
      email: "admin@amigosdabola.com",
      senhaHash: senha,
      role: "SUPER_ADMIN",
    },
  });

  // Atletas
  const atletasData: [string, string, string, "GOLEIRO" | "ZAGUEIRO" | "LATERAL" | "VOLANTE" | "MEIA" | "ATACANTE", number][] = [
    ["Marcão", "marcao@amigos.com", "Marcos Silva", "GOLEIRO", 1],
    ["Zé Roberto", "ze@amigos.com", "José Roberto Lima", "ZAGUEIRO", 3],
    ["Betão", "betao@amigos.com", "Roberto Nunes", "ZAGUEIRO", 4],
    ["Lelê", "lele@amigos.com", "Leandro Costa", "LATERAL", 2],
    ["Paulinho", "paulinho@amigos.com", "Paulo Henrique", "LATERAL", 6],
    ["Serginho", "serginho@amigos.com", "Sérgio Almeida", "VOLANTE", 5],
    ["Dudu", "dudu@amigos.com", "Eduardo Ramos", "MEIA", 8],
    ["Fabinho", "fabinho@amigos.com", "Fábio Santos", "MEIA", 10],
    ["Careca", "careca@amigos.com", "Antônio Carlos", "ATACANTE", 9],
    ["Nando", "nando@amigos.com", "Fernando Souza", "ATACANTE", 11],
    ["Tico", "tico@amigos.com", "Tiago Oliveira", "MEIA", 7],
    ["Gilmar", "gilmar@amigos.com", "Gilmar Pereira", "GOLEIRO", 12],
  ];

  const atletas: string[] = [];
  for (const [apelido, email, nome, posicao, numero] of atletasData) {
    const u = await prisma.usuario.upsert({
      where: { email },
      update: {},
      create: {
        nome, email, senhaHash: senha, role: "ATLETA",
        atleta: {
          create: {
            apelido, posicao, numeroCamisa: numero,
            nascimento: new Date(1975 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)),
          },
        },
      },
      include: { atleta: true },
    });
    const a = u.atleta ?? (await prisma.atleta.findUnique({ where: { usuarioId: u.id } }));
    if (a) atletas.push(a.id);
  }
  console.log("Atletas:", atletas.length);

  // Kits
  const kitTitular = await prisma.kit.create({
    data: {
      nome: "Titular verde", tipo: "TITULAR",
      corPrimaria: "#15803d", corSecundaria: "#facc15", corCalcao: "#0f172a", corMeiao: "#15803d",
      ano: 2025, fornecedor: "Loja do Bairro",
      pecas: { create: [{ tamanho: "M", quantidade: 8 }, { tamanho: "G", quantidade: 10 }, { tamanho: "GG", quantidade: 6 }] },
    },
  });
  const kitReserva = await prisma.kit.create({
    data: {
      nome: "Reserva branco", tipo: "RESERVA",
      corPrimaria: "#f8fafc", corSecundaria: "#15803d", corCalcao: "#f8fafc", corMeiao: "#f8fafc",
      ano: 2024,
      pecas: { create: [{ tamanho: "M", quantidade: 6 }, { tamanho: "G", quantidade: 9 }] },
    },
  });
  await prisma.kit.create({
    data: {
      nome: "Goleiro laranja", tipo: "GOLEIRO",
      corPrimaria: "#f97316", corSecundaria: "#0f172a",
      pecas: { create: [{ tamanho: "G", quantidade: 2 }] },
    },
  });

  // Adversários e locais
  const advNomes = ["Unidos da Vila", "Galáticos FC", "Real Botequim", "Juventus do Bairro"];
  const advs: string[] = [];
  for (const nome of advNomes) {
    const a = await prisma.adversario.create({ data: { nome, cidade: "São Paulo" } });
    advs.push(a.id);
  }
  const campo = await prisma.local.create({
    data: { nome: "Campo do Parque", endereco: "Rua das Palmeiras, 100", modalidade: "CAMPO", valorAluguel: 250 },
  });
  const quadra = await prisma.local.create({
    data: { nome: "Quadra Society Z10", endereco: "Av. Central, 55", modalidade: "FUTSAL", valorAluguel: 180 },
  });

  const copa = await prisma.competicao.create({
    data: { nome: "Copa dos Amigos", temporada: "2026", descricao: "Torneio anual entre os times da região" },
  });

  // Jogos encerrados com estatísticas
  const resultados: [number, number, number, string, string][] = [
    [-28, 3, 1, advs[0], kitTitular.id],
    [-21, 2, 2, advs[1], kitTitular.id],
    [-14, 1, 2, advs[2], kitReserva.id],
    [-7, 4, 0, advs[3], kitTitular.id],
  ];
  for (const [dias, gp, gc, advId, kitId] of resultados) {
    const data = new Date();
    data.setDate(data.getDate() + dias);
    data.setHours(9, 0, 0, 0);
    const jogo = await prisma.jogo.create({
      data: {
        dataHora: data, modalidade: "CAMPO", status: "ENCERRADO",
        adversarioId: advId, localId: campo.id, kitId,
        competicaoId: dias === -7 ? copa.id : null,
        golsPro: gp, golsContra: gc, encerradoEm: data, maxJogadores: 18,
      },
    });
    // 10 atletas presentes com stats distribuídos
    const presentes = atletas.slice(0, 10);
    let golsRestantes = gp;
    for (let i = 0; i < presentes.length; i++) {
      const ehGoleiro = i === 0;
      const gols = !ehGoleiro && golsRestantes > 0 && i >= 6 ? Math.min(golsRestantes, 1 + (i % 2)) : 0;
      golsRestantes -= gols;
      await prisma.participacao.create({
        data: {
          jogoId: jogo.id, atletaId: presentes[i], presente: true,
          gols, assistencias: gols > 0 ? 1 : i % 3 === 0 ? 1 : 0,
          cartaoAmarelo: i === 5 ? 1 : 0,
          golsSofridos: ehGoleiro ? gc : null,
        },
      });
      await prisma.confirmacao.create({
        data: { jogoId: jogo.id, atletaId: presentes[i], status: "CONFIRMADO" },
      });
    }
    // Notas e craque
    for (const avaliador of presentes.slice(0, 5)) {
      for (const avaliado of presentes) {
        if (avaliado === avaliador) continue;
        await prisma.notaJogador.create({
          data: {
            jogoId: jogo.id, avaliadoId: avaliado, avaliadorId: avaliador,
            nota: 5 + Math.round(Math.random() * 10) / 2,
          },
        });
      }
      await prisma.votoCraque.create({
        data: { jogoId: jogo.id, votanteId: avaliador, votadoId: presentes[8] },
      });
    }
  }

  // Próximos jogos
  const prox1 = new Date(); prox1.setDate(prox1.getDate() + 4); prox1.setHours(9, 0, 0, 0);
  const jogoProx = await prisma.jogo.create({
    data: {
      dataHora: prox1, modalidade: "CAMPO", adversarioId: advs[0],
      localId: campo.id, kitId: kitTitular.id, maxJogadores: 16,
      observacoes: "Chegar 8h30 para o aquecimento. Churrasco depois do jogo!",
    },
  });
  for (const a of atletas.slice(0, 8)) {
    await prisma.confirmacao.create({ data: { jogoId: jogoProx.id, atletaId: a, status: "CONFIRMADO" } });
  }
  const prox2 = new Date(); prox2.setDate(prox2.getDate() + 9); prox2.setHours(20, 0, 0, 0);
  await prisma.jogo.create({
    data: {
      dataHora: prox2, modalidade: "FUTSAL", adversarioId: advs[1],
      localId: quadra.id, kitId: kitReserva.id, maxJogadores: 10,
    },
  });

  // Mensalidades
  const agora = new Date();
  const competencias = [0, 1].map((m) => {
    const d = new Date(agora.getFullYear(), agora.getMonth() - m, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  for (const comp of competencias) {
    for (let i = 0; i < atletas.length; i++) {
      const pago = comp === competencias[1] || i < 7;
      await prisma.pagamento.create({
        data: {
          atletaId: atletas[i], competencia: comp, valor: 60,
          status: pago ? "PAGO" : i === 8 ? "AGUARDANDO_CONFIRMACAO" : "PENDENTE",
          pagoEm: pago ? new Date() : null,
          confirmadoPor: pago ? "Carlos Eduardo" : null,
        },
      });
      if (pago) {
        await prisma.lancamento.create({
          data: { tipo: "RECEITA", categoria: "mensalidade", descricao: `Mensalidade ${comp}`, valor: 60 },
        });
      }
    }
  }
  await prisma.lancamento.createMany({
    data: [
      { tipo: "DESPESA", categoria: "aluguel", descricao: "Aluguel campo — 4 jogos", valor: 1000 },
      { tipo: "DESPESA", categoria: "arbitragem", descricao: "Árbitro — últimos jogos", valor: 320 },
      { tipo: "DESPESA", categoria: "material", descricao: "2 bolas novas", valor: 240 },
    ],
  });

  // Patrimônio, aviso, lesão
  await prisma.patrimonio.createMany({
    data: [
      { nome: "Bola Penalty Campo", categoria: "bola", quantidade: 4 },
      { nome: "Coletes azuis", categoria: "colete", quantidade: 12 },
      { nome: "Kit primeiros socorros", categoria: "medicina", quantidade: 1 },
    ],
  });
  await prisma.aviso.create({
    data: {
      titulo: "Churrasco de aniversário do clube 🎉",
      texto: "Dia 26/07 depois do jogo, no Campo do Parque. Traga a família! Rateio de R$ 25 por pessoa.",
      autorId: (await prisma.usuario.findUnique({ where: { email: "admin@amigosdabola.com" } }))!.id,
      fixado: true,
    },
  });
  await prisma.lesao.create({
    data: { atletaId: atletas[10], descricao: "Estiramento na panturrilha", ativa: true },
  });

  console.log("Seed concluído!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
