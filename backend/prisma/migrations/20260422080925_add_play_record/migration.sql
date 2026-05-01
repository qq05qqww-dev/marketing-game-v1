-- CreateTable
CREATE TABLE "PlayRecord" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "campaignId" INTEGER NOT NULL,
    "prizeId" INTEGER,
    "isWin" BOOLEAN NOT NULL DEFAULT false,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlayRecord" ADD CONSTRAINT "PlayRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayRecord" ADD CONSTRAINT "PlayRecord_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayRecord" ADD CONSTRAINT "PlayRecord_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "Prize"("id") ON DELETE SET NULL ON UPDATE CASCADE;
