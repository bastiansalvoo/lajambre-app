import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Primero borramos los items de las ordenes fallidas para no violar llaves foráneas
  await prisma.orderItem.deleteMany({
    where: {
      orderId: {
        notIn: [21, 39]
      }
    }
  });

  // Luego borramos las ordenes en sí
  await prisma.order.deleteMany({
    where: {
      id: {
        notIn: [21, 39]
      }
    }
  });

  console.log('✅ Órdenes pendientes eliminadas con éxito. Solo quedaron la #21 y #39.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });