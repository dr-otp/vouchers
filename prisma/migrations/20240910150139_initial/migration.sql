-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('CREATED', 'RECEIVED', 'REJECTED', 'RETURNED_TO_SENDER', 'RETURNED_TO_SUPPLIER');

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "code" SERIAL NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'CREATED',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherHistory" (
    "id" TEXT NOT NULL,
    "status" "VoucherStatus" NOT NULL,
    "voucherId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "voucherId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");

-- AddForeignKey
ALTER TABLE "VoucherHistory" ADD CONSTRAINT "VoucherHistory_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherItem" ADD CONSTRAINT "VoucherItem_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
