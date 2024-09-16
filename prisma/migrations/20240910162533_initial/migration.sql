/*
  Warnings:

  - You are about to drop the column `status` on the `voucher_history` table. All the data in the column will be lost.
  - Added the required column `description` to the `voucher_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "voucher_history" DROP COLUMN "status",
ADD COLUMN     "description" VARCHAR(255) NOT NULL;
