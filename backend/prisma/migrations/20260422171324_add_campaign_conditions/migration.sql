-- CreateEnum
CREATE TYPE "MemberLevel" AS ENUM ('NORMAL', 'VIP');

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "allowedRole" "UserRole",
ADD COLUMN     "requireLogin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "requiredLevel" "MemberLevel";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "memberLevel" "MemberLevel" NOT NULL DEFAULT 'NORMAL';
