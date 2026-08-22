-- CreateTable
CREATE TABLE "Reward" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🎁',
    "pointsCost" INTEGER NOT NULL,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "freeDelivery" BOOLEAN NOT NULL DEFAULT false,
    "requiresBurger" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reward_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Reward_code_key" ON "Reward"("code");

-- Seed: valores unificados con lo que ya se cobraba de verdad en el
-- checkout (antes vivian hardcodeados y desincronizados en dos archivos).
INSERT INTO "Reward" ("code", "name", "icon", "pointsCost", "discountAmount", "freeDelivery", "requiresBurger", "isActive", "updatedAt") VALUES
    ('QUESO_GRATIS',   'Queso Extra',      '🧀', 120, 1200, false, false, true, CURRENT_TIMESTAMP),
    ('TOCINO_GRATIS',  'Tocino Extra',     '🥓', 200, 1200, false, false, true, CURRENT_TIMESTAMP),
    ('BEBIDA_GRATIS',  'Bebida Gratis',    '🥤', 150, 1200, false, false, true, CURRENT_TIMESTAMP),
    ('DELIVERY_GRATIS','Delivery Gratis',  '🚚', 200,    0, true,  false, true, CURRENT_TIMESTAMP),
    ('PAPAS_GRATIS',   'Papas Rústicas',   '🍟', 180, 2500, false, false, true, CURRENT_TIMESTAMP),
    ('CARNE_EXTRA',    'Carne Extra',      '🥩', 250, 2000, false, false, true, CURRENT_TIMESTAMP),
    ('DOS_BEBIDAS',    'Dos Bebidas',      '🧊', 250, 2000, false, false, true, CURRENT_TIMESTAMP),
    ('UPGRADE_BURGER', 'Upgrade Premium',  '⭐', 300, 2000, false, true,  true, CURRENT_TIMESTAMP),
    ('DOS_POR_UNO',    'Promo 2x1',        '🍔', 600, 8490, false, true,  true, CURRENT_TIMESTAMP),
    ('BURGER_GRATIS',  'Burger Gratis',    '🍔', 800, 8490, false, false, true, CURRENT_TIMESTAMP);
