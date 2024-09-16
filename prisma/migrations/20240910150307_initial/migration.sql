/*
  Warnings:

  - You are about to drop the `Voucher` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VoucherHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VoucherItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "VoucherHistory" DROP CONSTRAINT "VoucherHistory_voucherId_fkey";

-- DropForeignKey
ALTER TABLE "VoucherItem" DROP CONSTRAINT "VoucherItem_voucherId_fkey";

-- DropTable
DROP TABLE "Voucher";

-- DropTable
DROP TABLE "VoucherHistory";

-- DropTable
DROP TABLE "VoucherItem";

-- CreateTable
CREATE TABLE "voucher" (
    "id" TEXT NOT NULL,
    "code" SERIAL NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'CREATED',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_history" (
    "id" TEXT NOT NULL,
    "status" "VoucherStatus" NOT NULL,
    "voucherId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_item" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "voucherId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voucher_code_key" ON "voucher"("code");

-- AddForeignKey
ALTER TABLE "voucher_history" ADD CONSTRAINT "voucher_history_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_item" ADD CONSTRAINT "voucher_item_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
