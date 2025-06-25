-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'COGNITO');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN     "cognitoSub" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_cognitoSub_key" ON "User"("cognitoSub");

-- CreateIndex
CREATE INDEX "User_cognitoSub_idx" ON "User"("cognitoSub");