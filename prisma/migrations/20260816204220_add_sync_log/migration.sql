-- CreateTable
CREATE TABLE "SyncLog" (
    "zip" TEXT NOT NULL,
    "radiusMiles" INTEGER NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("zip")
);
