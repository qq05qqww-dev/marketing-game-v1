-- CreateTable
CREATE TABLE "ShareRewardLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "campaignId" INTEGER,
    "gameId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL DEFAULT 'SHARE',
    "rewardCount" INTEGER NOT NULL DEFAULT 1,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareRewardLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShareRewardLog_userId_idx" ON "ShareRewardLog"("userId");

-- CreateIndex
CREATE INDEX "ShareRewardLog_gameId_idx" ON "ShareRewardLog"("gameId");

-- CreateIndex
CREATE INDEX "ShareRewardLog_createdAt_idx" ON "ShareRewardLog"("createdAt");

-- CreateIndex
CREATE INDEX "ShareRewardLog_userId_gameId_createdAt_idx" ON "ShareRewardLog"("userId", "gameId", "createdAt");

-- AddForeignKey
ALTER TABLE "ShareRewardLog" ADD CONSTRAINT "ShareRewardLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
