/*
  Warnings:

  - You are about to drop the column `authProvider` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - Made the column `cognitoSub` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "authProvider",
DROP COLUMN "passwordHash",
ALTER COLUMN "cognitoSub" SET NOT NULL;

-- DropEnum
DROP TYPE "AuthProvider";
