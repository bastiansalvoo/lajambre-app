-- AlterTable
ALTER TABLE "Extra" ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "deliveryFee" SET DEFAULT 1250;

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItemExtra_orderItemId_idx" ON "OrderItemExtra"("orderItemId");

-- CreateIndex
CREATE INDEX "OrderItemExtra_extraId_idx" ON "OrderItemExtra"("extraId");
