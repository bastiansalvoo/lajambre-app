-- CreateTable
CREATE TABLE "StoreStatus" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreStatus_pkey" PRIMARY KEY ("id")
);
