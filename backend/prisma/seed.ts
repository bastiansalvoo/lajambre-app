import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg'; // <-- Importamos el driver nativo
import { PrismaPg } from '@prisma/adapter-pg'; // <-- Importamos el adaptador
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// 1. Cargar las variables de entorno
dotenv.config();

// 2. Configurar el Pool de conexiones usando tu DATABASE_URL
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// 3. ¡La magia! Le pasamos el adaptador a Prisma (esto era lo que pedía a gritos)
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando la plantación de datos (Seeding) para Lajambre...');

  // 1. Limpieza total (Evita datos duplicados)
  await prisma.orderItemExtra.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.extra.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Base de datos limpiada y lista.');

  // 2. Crear Usuario Administrador (Angelo)
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@lajambre.cl',
      password: hashedPassword,
      name: 'Angelo (Admin)',
      phone: '+5692158434', // Teléfono del flyer
      role: 'ADMIN',
    },
  });
  console.log(`👑 Admin creado: ${admin.email} (Clave: admin123)`);

  // 3. Crear Categorías
  const catBurgers = await prisma.category.create({
    data: { name: 'Hamburguesas' },
  });
  const catBebidas = await prisma.category.create({
    data: { name: 'Bebidas' },
  });
  console.log('📁 Categorías del menú creadas.');

  // 4. Crear Productos (Menú Oficial extraído del Flyer)
  const productos = await prisma.product.createMany({
    data: [
      {
        name: 'Clásica',
        description:
          'Nuestra esencia hecha burger. Hamburguesa de 150g de carne especial, con salsa Lajambre, lechuga fresca, pepinillos, tomate, doble queso cheddar, cebolla morada y tocino crocante, todo en pan artesanal.',
        price: 7990,
        categoryId: catBurgers.id,
      },
      {
        name: 'La de Palta',
        description:
          'La favorita de los que aman lo cremoso con carácter. Hamburguesa de 150g de carne especial, con salsa Lajambre, lechuga, pepinillos, doble queso cheddar, palta molida especiada, huevo frito y cebolla morada, todo en pan artesanal.',
        price: 8490,
        categoryId: catBurgers.id,
      },
      {
        name: 'BBQ',
        description:
          'Para los que buscan sabor ahumado y contundente. Hamburguesa de 150g de carne especial, con salsa BBQ, champiñones salteados, cebolla caramelizada, tocino, doble queso cheddar y toque final de salsa especial Lajambre, todo en pan artesanal.',
        price: 8990,
        categoryId: catBurgers.id,
      },
      {
        name: 'Triplecheese',
        description:
          'Intensa, cremosa y con carácter. Hamburguesa de 150g de carne especial, con toque suave de salsa Lajambre, lechuga, pepinillos, cebolla salteada al vino blanco, mezcla cremosa de gouda, cheddar y queso azul terminando con tocino en el tope, todo en pan artesanal.',
        price: 8790,
        categoryId: catBurgers.id,
      },
      {
        name: 'Mostaza-Miel',
        description:
          'Dulce, sabrosa y perfectamente equilibrada. Hamburguesa de 150g de carne especial, con salsa mostaza-miel Lajambre, lechuga fresca, queso gouda, cebolla caramelizada, pepinillos laminados y tocino crocante, todo en pan artesanal.',
        price: 8290,
        categoryId: catBurgers.id,
      },
      // Bebidas
      {
        name: 'Lata de Bebida',
        description: 'Agrega una lata de bebida a tu pedido.',
        price: 1000,
        categoryId: catBebidas.id,
      },
    ],
  });
  console.log(`🍔 ${productos.count} productos agregados a la carta.`);

  // 5. Crear Ingredientes Extras
  const extras = await prisma.extra.createMany({
    data: [
      { name: 'Carne Extra', price: 2000 },
      { name: 'Salsa Lajambre Extra', price: 500 },
      // Nota: El flyer dice que toda burger lleva papas, así que no necesitamos cobrarlas aparte como extra a menos que quieran doble porción.
    ],
  });
  console.log(`🥓 ${extras.count} extras agregados.`);

  console.log(
    '🚀 ¡Seeding completado con éxito! Menú Lajambre 100% operativo.',
  );
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
