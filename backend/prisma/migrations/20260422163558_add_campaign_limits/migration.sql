-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "dailyLimit" INTEGER DEFAULT 3,
ADD COLUMN     "totalLimit" INTEGER DEFAULT 10;
