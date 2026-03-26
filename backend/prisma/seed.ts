import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- FORZANDO CONEXIÓN DIRECTA ---');
  console.log('Iniciando siembra de datos...');

  // 1. Limpieza de datos (Orden correcto para evitar errores de FK)
  // Usamos un orden inverso al de creación
  await prisma.orderItemExtra.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.extra.deleteMany();
  await prisma.user.deleteMany();

  console.log('Tablas limpias...');

  // 2. Crear Categoría
  const catBurguers = await prisma.category.create({
    data: { name: 'Hamburguesas' },
  });

  // 3. Crear Productos
  // Nota: createMany es eficiente, pero no devuelve los IDs en algunas DBs. 
  // Aquí está bien porque solo los estamos creando.
  await prisma.product.createMany({
    data: [
      {
        name: 'Clásica',
        description: 'Lechuga, tomate, cebolla morada y salsa de la casa.',
        price: 7990,
        categoryId: catBurguers.id,
      },
      {
        name: 'La de Palta',
        description: 'Mucha palta nacional, mayo casera y tomate.',
        price: 8490,
        categoryId: catBurguers.id,
      },
      {
        name: 'BBQ Bacon',
        description: 'Tocino crocante, aros de cebolla y salsa BBQ.',
        price: 8990,
        categoryId: catBurguers.id,
      },
      {
        name: 'Triple Cheese',
        description: 'Tres láminas de cheddar fundido y cebolla grillada.',
        price: 8790,
        categoryId: catBurguers.id,
      },
      {
        name: 'Mostaza Miel',
        description: 'Pollo o carne con salsa mostaza miel y rúcula.',
        price: 8290,
        categoryId: catBurguers.id,
      },
    ],
  });

  console.log('¡Base de datos de Lajambre sembrada con éxito! 🍔');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


  