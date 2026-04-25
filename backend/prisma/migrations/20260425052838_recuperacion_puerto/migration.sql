-- CreateEnum
CREATE TYPE "PointTransactionType" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "pointsEarned" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pointsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "rewardType" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pointsBalance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "PointTransaction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "orderId" INTEGER,
    "points" INTEGER NOT NULL,
    "type" "PointTransactionType" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PointTransaction_userId_idx" ON "PointTransaction"("userId");

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointTransaction" ADD CONSTRAINT "PointTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
