import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.shirtArtCard.count();
  if (count > 0) {
    console.log("Seed: já existem cards, nada a fazer.");
    return;
  }

  await prisma.shirtArtCard.create({
    data: {
      columnId: "nova_solicitacao",
      clientName: "Cliente exemplo",
      clientPhone: "(11) 99999-0000",
      briefingModelagem: "Camiseta gola redonda",
      briefingCor: "Preto com detalhes brancos",
      briefingFrente: "Logo centralizado 12 cm",
      briefingCosta: "Nome do evento em arco",
      briefingPeitoDireito: "—",
      briefingPeitoEsquerdo: "—",
      briefingMangaDireita: "—",
      briefingMangaEsquerda: "—",
      briefingEscrita: "Fonte sans-serif bold",
      attachmentsCliente: [],
      attachmentsReferencias: [],
    },
  });

  console.log("Seed OK: 1 card de exemplo em Nova Solicitação.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
