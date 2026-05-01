/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Campaign` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PrizeType" AS ENUM ('WIN', 'LOSE');

-- CreateEnum
CREATE TYPE "PrizeStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "SerialCodeStatus" AS ENUM ('UNUSED', 'USED', 'DISABLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PlayStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'CLAIMED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "GameType" ADD VALUE 'GOLDEN_EGG';

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "PlayRecord" ADD COLUMN     "gameType" "GameType" NOT NULL DEFAULT 'WHEEL',
ADD COLUMN     "playerEmail" TEXT,
ADD COLUMN     "playerIp" TEXT,
ADD COLUMN     "playerName" TEXT,
ADD COLUMN     "playerPhone" TEXT,
ADD COLUMN     "resultPayload" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "serialCodeId" INTEGER,
ADD COLUMN     "status" "PlayStatus" NOT NULL DEFAULT 'SUCCESS',
ADD COLUMN     "userAgent" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Prize" ADD COLUMN     "description" TEXT,
ADD COLUMN     "icon" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "shortName" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "PrizeStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "stockTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" "PrizeType" NOT NULL DEFAULT 'WIN';

-- CreateTable
CREATE TABLE "GameConfig" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerialCode" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "rewardChance" INTEGER NOT NULL DEFAULT 1,
    "status" "SerialCodeStatus" NOT NULL DEFAULT 'UNUSED',
    "batchCode" TEXT,
    "note" TEXT,
    "distributedAt" TIMESTAMP(3),
    "distributedTo" TEXT,
    "distributedChannel" TEXT,
    "usedAt" TIMESTAMP(3),
    "usedBy" TEXT,
    "expireAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SerialCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardRecord" (
    "id" SERIAL NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "playRecordId" INTEGER NOT NULL,
    "prizeId" INTEGER,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "winnerName" TEXT,
    "winnerPhone" TEXT,
    "winnerEmail" TEXT,
    "claimCode" TEXT,
    "claimedAt" TIMESTAMP(3),
    "claimedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RewardRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameConfig_campaignId_key" ON "GameConfig"("campaignId");

-- CreateIndex
CREATE UNIQUE INDEX "SerialCode_code_key" ON "SerialCode"("code");

-- CreateIndex
CREATE INDEX "SerialCode_campaignId_idx" ON "SerialCode"("campaignId");

-- CreateIndex
CREATE INDEX "SerialCode_status_idx" ON "SerialCode"("status");

-- CreateIndex
CREATE INDEX "SerialCode_batchCode_idx" ON "SerialCode"("batchCode");

-- CreateIndex
CREATE INDEX "SerialCode_expireAt_idx" ON "SerialCode"("expireAt");

-- CreateIndex
CREATE INDEX "SerialCode_distributedAt_idx" ON "SerialCode"("distributedAt");

-- CreateIndex
CREATE INDEX "SerialCode_usedAt_idx" ON "SerialCode"("usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RewardRecord_playRecordId_key" ON "RewardRecord"("playRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "RewardRecord_claimCode_key" ON "RewardRecord"("claimCode");

-- CreateIndex
CREATE INDEX "RewardRecord_campaignId_idx" ON "RewardRecord"("campaignId");

-- CreateIndex
CREATE INDEX "RewardRecord_prizeId_idx" ON "RewardRecord"("prizeId");

-- CreateIndex
CREATE INDEX "RewardRecord_status_idx" ON "RewardRecord"("status");

-- CreateIndex
CREATE INDEX "RewardRecord_createdAt_idx" ON "RewardRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");

-- CreateIndex
CREATE INDEX "Campaign_gameType_idx" ON "Campaign"("gameType");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_startAt_idx" ON "Campaign"("startAt");

-- CreateIndex
CREATE INDEX "Campaign_endAt_idx" ON "Campaign"("endAt");

-- CreateIndex
CREATE INDEX "PlayRecord_userId_idx" ON "PlayRecord"("userId");

-- CreateIndex
CREATE INDEX "PlayRecord_campaignId_idx" ON "PlayRecord"("campaignId");

-- CreateIndex
CREATE INDEX "PlayRecord_gameType_idx" ON "PlayRecord"("gameType");

-- CreateIndex
CREATE INDEX "PlayRecord_prizeId_idx" ON "PlayRecord"("prizeId");

-- CreateIndex
CREATE INDEX "PlayRecord_serialCodeId_idx" ON "PlayRecord"("serialCodeId");

-- CreateIndex
CREATE INDEX "PlayRecord_playedAt_idx" ON "PlayRecord"("playedAt");

-- CreateIndex
CREATE INDEX "Prize_campaignId_idx" ON "Prize"("campaignId");

-- CreateIndex
CREATE INDEX "Prize_status_idx" ON "Prize"("status");

-- CreateIndex
CREATE INDEX "Prize_type_idx" ON "Prize"("type");

-- AddForeignKey
ALTER TABLE "GameConfig" ADD CONSTRAINT "GameConfig_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerialCode" ADD CONSTRAINT "SerialCode_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayRecord" ADD CONSTRAINT "PlayRecord_serialCodeId_fkey" FOREIGN KEY ("serialCodeId") REFERENCES "SerialCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRecord" ADD CONSTRAINT "RewardRecord_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRecord" ADD CONSTRAINT "RewardRecord_playRecordId_fkey" FOREIGN KEY ("playRecordId") REFERENCES "PlayRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRecord" ADD CONSTRAINT "RewardRecord_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "Prize"("id") ON DELETE SET NULL ON UPDATE CASCADE;
