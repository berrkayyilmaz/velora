-- CreateEnum
CREATE TYPE "WardrobeItemStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED', 'DELETION_PENDING');

-- AlterTable
ALTER TABLE "AnalyticsEvent" ADD COLUMN     "wardrobeItemId" UUID;

-- CreateTable
CREATE TABLE "WardrobeItem" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "color" TEXT,
    "brandLabel" TEXT,
    "notes" TEXT,
    "status" "WardrobeItemStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WardrobeItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WardrobeItem_userId_status_updatedAt_idx" ON "WardrobeItem"("userId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "WardrobeItem_userId_categoryId_idx" ON "WardrobeItem"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "WardrobeItem_categoryId_idx" ON "WardrobeItem"("categoryId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_wardrobeItemId_eventType_idx" ON "AnalyticsEvent"("wardrobeItemId", "eventType");

-- AddForeignKey
ALTER TABLE "WardrobeItem" ADD CONSTRAINT "WardrobeItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WardrobeItem" ADD CONSTRAINT "WardrobeItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_wardrobeItemId_fkey" FOREIGN KEY ("wardrobeItemId") REFERENCES "WardrobeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
