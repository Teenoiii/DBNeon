/*
  Warnings:

  - You are about to drop the column `color` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `qty` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Spin` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `imageUrl` on table `Item` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Spin" DROP CONSTRAINT "Spin_itemId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Spin" DROP CONSTRAINT "Spin_userId_fkey";

-- DropIndex
DROP INDEX "public"."Item_name_key";

-- AlterTable
ALTER TABLE "public"."Item" DROP COLUMN "color",
DROP COLUMN "qty",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rarity" TEXT NOT NULL DEFAULT 'common',
ADD COLUMN     "stock" INTEGER,
ALTER COLUMN "imageUrl" SET NOT NULL,
ALTER COLUMN "weight" SET DEFAULT 10;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "password",
ADD COLUMN     "passwordHash" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."Spin";

-- CreateTable
CREATE TABLE "public"."SpinHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "spent" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpinHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."SpinHistory" ADD CONSTRAINT "SpinHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SpinHistory" ADD CONSTRAINT "SpinHistory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
