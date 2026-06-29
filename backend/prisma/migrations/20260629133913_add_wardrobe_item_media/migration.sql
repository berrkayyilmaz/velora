-- CreateEnum
CREATE TYPE "WardrobeItemMediaPurpose" AS ENUM ('PRIMARY');

-- CreateEnum
CREATE TYPE "WardrobeItemMediaStatus" AS ENUM ('UPLOADING', 'READY', 'FAILED', 'DELETION_PENDING');

-- CreateTable
CREATE TABLE "WardrobeItemMedia" (
    "id" UUID NOT NULL,
    "wardrobeItemId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "purpose" "WardrobeItemMediaPurpose" NOT NULL DEFAULT 'PRIMARY',
    "status" "WardrobeItemMediaStatus" NOT NULL DEFAULT 'UPLOADING',
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "WardrobeItemMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WardrobeItemMedia_storageKey_key" ON "WardrobeItemMedia"("storageKey");

-- CreateIndex
CREATE INDEX "WardrobeItemMedia_wardrobeItemId_status_idx" ON "WardrobeItemMedia"("wardrobeItemId", "status");

-- AddForeignKey
ALTER TABLE "WardrobeItemMedia" ADD CONSTRAINT "WardrobeItemMedia_wardrobeItemId_fkey" FOREIGN KEY ("wardrobeItemId") REFERENCES "WardrobeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
