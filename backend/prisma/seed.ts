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

  // 2. Crear Usuarios Administradores
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);

  const admins = [
    { email: 'angelo@lajambre.cl', name: 'Angelo (Admin)' },
    { email: 'bastian@lajambre.cl', name: 'Bastián (Admin)' },
    { email: 'benjamin@lajambre.cl', name: 'Benjamín (Admin)' }
  ];

  for (const admin of admins) {
    await prisma.user.create({
      data: {
        email: admin.email,
        password: hashedPassword,
        name: admin.name,
        phone: '+5692158434', // Teléfono del flyer
        role: 'ADMIN',
        isVerified: true,
      },
    });
    console.log(`👑 Admin creado: ${admin.email} (Clave: admin123)`);
  }

  // 3. Crear Categorías
  const catBurgers = await prisma.category.create({
    data: { name: 'Hamburguesas' },
  });
  const catEsenciales = await prisma.category.create({
    data: { name: 'Esenciales' },
  });
  const catBebidas = await prisma.category.create({
    data: { name: 'Bebidas' },
  });
  console.log('📁 Categorías del menú creadas.');

  // 4. Crear Productos (Menú Oficial Junio 2026)
  const productos = await prisma.product.createMany({
    data: [
      {
        name: 'Clásica',
        description:
          'Salsa Lajambre, lechuga, pepinillos, tomate, doble cheddar, cebolla morada y tocino crocante.',
        price: 8590,
        categoryId: catBurgers.id,
      },
      {
        name: 'La Paltaza',
        description:
          'Salsa Lajambre, lechuga, pepinillos, doble cheddar, palta molida, huevo frito y cebolla morada.',
        price: 8790,
        categoryId: catBurgers.id,
      },
      {
        name: 'BBQ',
        description:
          'Salsa BBQ, champiñones salteados, cebolla caramelizada, tocino, doble cheddar y toque de salsa Lajambre.',
        price: 9990,
        categoryId: catBurgers.id,
      },
      {
        name: 'Triplecheese',
        description:
          'Salsa Lajambre, lechuga, pepinillos, cebolla al vino blanco, mix de quesos (gouda, cheddar, azul) y tocino en el tope.',
        price: 9790,
        categoryId: catBurgers.id,
      },
      {
        name: 'Mostaza-Miel',
        description:
          'Salsa mostaza-miel Lajambre, lechuga, queso gouda, cebolla caramelizada, pepinillos laminados y tocino crocante.',
        price: 8990,
        categoryId: catBurgers.id,
      },
      {
        name: 'La Chacarera',
        description:
          'Mayonesa, tomate fresco, porotos verdes, ají en rodajas y doble queso cheddar.',
        price: 8290,
        categoryId: catBurgers.id,
      },
      {
        name: 'La 4to Lajambre',
        description:
          'Salsa Lajambre, lechuga fresca, pepinillos, doble cheddar y cebolla en cubos.',
        price: 7990,
        categoryId: catBurgers.id,
      },
      // Bebidas
      {
        name: 'Lata de Bebida',
        description: 'Agrega una lata de bebida a tu pedido.',
        price: 1200,
        categoryId: catBebidas.id,
      },
      // ESENCIALES (Menú 2)
      {
        name: 'La Simple',
        description: 'Carne 100g, cheddar, pepinillos, ketchup y mostaza.',
        price: 5790,
        categoryId: catEsenciales.id,
      },
      {
        name: 'Cheese Burger',
        description: 'Carne 100g, 2 láminas de cheddar.',
        price: 6490,
        categoryId: catEsenciales.id,
      },
      {
        name: 'Bacon Cheese',
        description: 'Carne 100g, cheddar, tocino y salsa Lajambre.',
        price: 6790,
        categoryId: catEsenciales.id,
      },
      {
        name: 'Cebolla Grill',
        description: 'Carne 100g, cheddar, cebolla grill y salsa Lajambre.',
        price: 5990,
        categoryId: catEsenciales.id,
      },
      {
        name: 'Cheese Cebolla Crispy',
        description: 'Carne 100g, cheddar, cebolla crispy y salsa Lajambre.',
        price: 6990,
        categoryId: catEsenciales.id,
      },
      {
        name: 'Egg Cheese',
        description: 'Carne 100g, cheddar, huevo frito y salsa Lajambre.',
        price: 6590,
        categoryId: catEsenciales.id,
      },
    ],
  });
  console.log(`🍔 ${productos.count} productos agregados a la carta.`);

  // 5. Crear Extras y Adicionales (Menú Junio 2026)
  const extras = await prisma.extra.createMany({
    data: [
      // Extras a $1.000
      { name: 'Tocino', price: 1000 },
      { name: 'Palta', price: 1000 },
      { name: 'Queso (2 láminas)', price: 1000 },
      { name: 'Cebolla pochada', price: 1000 },
      { name: 'Champiñones salteados', price: 1000 },
      // Extras a $500
      { name: 'Huevo', price: 500 },
      { name: 'Lechuga', price: 500 },
      { name: 'Tomate', price: 500 },
      { name: 'Pepinillos', price: 500 },
      // Para sumar más hambre
      { name: 'Carne Extra (100g)', price: 2000 },
      { name: 'Carne Extra (150g)', price: 3000 },
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
