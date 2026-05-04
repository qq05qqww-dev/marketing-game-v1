-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'MERCHANT_ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'MERCHANT_STAFF';

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "GameConfig" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "PlayRecord" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "Prize" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "RewardRecord" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "SerialCode" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "ShareRewardLog" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "tenantId" INTEGER;

-- AlterTable
ALTER TABLE "UserReward" ADD COLUMN     "tenantId" INTEGER;

-- CreateTable
CREATE TABLE "Tenant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "Tenant_createdAt_idx" ON "Tenant"("createdAt");

-- CreateIndex
CREATE INDEX "Campaign_tenantId_idx" ON "Campaign"("tenantId");

-- CreateIndex
CREATE INDEX "GameConfig_tenantId_idx" ON "GameConfig"("tenantId");

-- CreateIndex
CREATE INDEX "PlayRecord_tenantId_idx" ON "PlayRecord"("tenantId");

-- CreateIndex
CREATE INDEX "Prize_tenantId_idx" ON "Prize"("tenantId");

-- CreateIndex
CREATE INDEX "RewardRecord_tenantId_idx" ON "RewardRecord"("tenantId");

-- CreateIndex
CREATE INDEX "SerialCode_tenantId_idx" ON "SerialCode"("tenantId");

-- CreateIndex
CREATE INDEX "ShareRewardLog_tenantId_idx" ON "ShareRewardLog"("tenantId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "UserReward_tenantId_idx" ON "UserReward"("tenantId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameConfig" ADD CONSTRAINT "GameConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReward" ADD CONSTRAINT "UserReward_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialCode" ADD CONSTRAINT "SerialCode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayRecord" ADD CONSTRAINT "PlayRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRecord" ADD CONSTRAINT "RewardRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareRewardLog" ADD CONSTRAINT "ShareRewardLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
