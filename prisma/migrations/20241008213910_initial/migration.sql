-- CreateEnum
CREATE TYPE "VoucherStatus" AS ENUM ('CREATED', 'RECEIVED', 'REJECTED', 'RETURNED_TO_SENDER', 'RETURNED_TO_SUPPLIER', 'CANCELLED');

-- CreateTable
CREATE TABLE "voucher" (
    "id" TEXT NOT NULL,
    "code" SERIAL NOT NULL,
    "status" "VoucherStatus" NOT NULL DEFAULT 'CREATED',
    "client_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "deleted_by_id" TEXT,

    CONSTRAINT "voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_history" (
    "id" TEXT NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voucher_item" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voucher_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voucher_code_key" ON "voucher"("code");

-- AddForeignKey
ALTER TABLE "voucher_history" ADD CONSTRAINT "voucher_history_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_item" ADD CONSTRAINT "voucher_item_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
