-- CreateTable
CREATE TABLE "OutfitWardrobeItem" (
    "id" UUID NOT NULL,
    "outfitId" UUID NOT NULL,
    "wardrobeItemId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutfitWardrobeItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutfitWardrobeItem_outfitId_idx" ON "OutfitWardrobeItem"("outfitId");

-- CreateIndex
CREATE INDEX "OutfitWardrobeItem_wardrobeItemId_idx" ON "OutfitWardrobeItem"("wardrobeItemId");

-- CreateIndex
CREATE UNIQUE INDEX "OutfitWardrobeItem_outfitId_wardrobeItemId_key" ON "OutfitWardrobeItem"("outfitId", "wardrobeItemId");

-- AddForeignKey
ALTER TABLE "OutfitWardrobeItem" ADD CONSTRAINT "OutfitWardrobeItem_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutfitWardrobeItem" ADD CONSTRAINT "OutfitWardrobeItem_wardrobeItemId_fkey" FOREIGN KEY ("wardrobeItemId") REFERENCES "WardrobeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
