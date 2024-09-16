/*
  Warnings:

  - You are about to drop the column `createdAt` on the `voucher` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `voucher` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `voucher` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `voucher` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `voucher_history` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `voucher_history` table. All the data in the column will be lost.
  - You are about to drop the column `voucherId` on the `voucher_history` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `voucher_item` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `voucher_item` table. All the data in the column will be lost.
  - You are about to drop the column `voucherId` on the `voucher_item` table. All the data in the column will be lost.
  - Added the required column `client_id` to the `voucher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `voucher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `voucher` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `voucher_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `voucher_id` to the `voucher_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `voucher_item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `voucher_id` to the `voucher_item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "VoucherStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "voucher_history" DROP CONSTRAINT "voucher_history_voucherId_fkey";

-- DropForeignKey
ALTER TABLE "voucher_item" DROP CONSTRAINT "voucher_item_voucherId_fkey";

-- AlterTable
ALTER TABLE "voucher" DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "updatedAt",
DROP COLUMN "userId",
ADD COLUMN     "client_id" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "voucher_history" DROP COLUMN "createdAt",
DROP COLUMN "userId",
DROP COLUMN "voucherId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD COLUMN     "voucher_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "voucher_item" DROP COLUMN "createdAt",
DROP COLUMN "productId",
DROP COLUMN "voucherId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "product_id" TEXT NOT NULL,
ADD COLUMN     "voucher_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "voucher_history" ADD CONSTRAINT "voucher_history_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voucher_item" ADD CONSTRAINT "voucher_item_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
