-- CreateTable
CREATE TABLE "public"."Config" (
    "id" SERIAL NOT NULL,
    "spinCost" INTEGER NOT NULL DEFAULT 50,
    "title" TEXT,
    "subtitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);
