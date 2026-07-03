DELETE FROM "OrderItemExtra" WHERE "orderItemId" IN (SELECT id FROM "OrderItem" WHERE "orderId" NOT IN (21, 39));
DELETE FROM "OrderItem" WHERE "orderId" NOT IN (21, 39);
DELETE FROM "PointTransaction" WHERE "orderId" NOT IN (21, 39) AND "orderId" IS NOT NULL;
DELETE FROM "Order" WHERE "id" NOT IN (21, 39);
