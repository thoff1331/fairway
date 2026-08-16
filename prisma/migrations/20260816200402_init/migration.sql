-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "sourceApiId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "bookingUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_sourceApiId_key" ON "Course"("sourceApiId");

-- CreateIndex
CREATE INDEX "Course_lat_lng_idx" ON "Course"("lat", "lng");
