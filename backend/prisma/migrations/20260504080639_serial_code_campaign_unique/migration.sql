/*
  Warnings:

  - A unique constraint covering the columns `[campaignId,code]` on the table `SerialCode` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SerialCode_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "SerialCode_campaignId_code_key" ON "SerialCode"("campaignId", "code");
