-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PREPARANDO';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "contactPhone" TEXT,
ADD COLUMN     "deliveryAddress" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationToken" TEXT;
