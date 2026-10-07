-- CreateTable
CREATE TABLE "KeepAlive" (
    "id" TEXT NOT NULL,
    "pings" INTEGER NOT NULL DEFAULT 0,
    "pingedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeepAlive_pkey" PRIMARY KEY ("id")
);
