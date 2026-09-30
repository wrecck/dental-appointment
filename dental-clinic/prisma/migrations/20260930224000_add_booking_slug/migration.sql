-- AlterTable
ALTER TABLE "Clinic" ADD COLUMN "bookingSlug" TEXT;
ALTER TABLE "Clinic" ADD COLUMN "bookingEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_bookingSlug_key" ON "Clinic"("bookingSlug");
