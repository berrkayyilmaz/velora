-- CreateEnum
CREATE TYPE "TryOnJobStatus" AS ENUM ('QUEUED', 'VALIDATING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TryOnResultStatus" AS ENUM ('READY', 'FAILED', 'DELETION_PENDING', 'DELETED');

-- CreateTable
CREATE TABLE "TryOnConsent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL,
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TryOnConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryOnJob" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "consentId" UUID NOT NULL,
    "personImageStorageKey" TEXT,
    "productId" UUID,
    "wardrobeItemId" UUID,
    "outfitId" UUID,
    "status" "TryOnJobStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT,
    "providerVersion" TEXT,
    "modelVersion" TEXT,
    "idempotencyKey" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "processingStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TryOnJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TryOnResult" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "fileSize" INTEGER,
    "provider" TEXT NOT NULL,
    "modelVersion" TEXT,
    "status" "TryOnResultStatus" NOT NULL DEFAULT 'READY',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "TryOnResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TryOnConsent_userId_grantedAt_idx" ON "TryOnConsent"("userId", "grantedAt");

-- CreateIndex
CREATE INDEX "TryOnConsent_userId_purpose_withdrawnAt_idx" ON "TryOnConsent"("userId", "purpose", "withdrawnAt");

-- CreateIndex
CREATE INDEX "TryOnJob_userId_status_createdAt_idx" ON "TryOnJob"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "TryOnJob_userId_createdAt_idx" ON "TryOnJob"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TryOnJob_consentId_idx" ON "TryOnJob"("consentId");

-- CreateIndex
CREATE INDEX "TryOnJob_productId_idx" ON "TryOnJob"("productId");

-- CreateIndex
CREATE INDEX "TryOnJob_wardrobeItemId_idx" ON "TryOnJob"("wardrobeItemId");

-- CreateIndex
CREATE INDEX "TryOnJob_outfitId_idx" ON "TryOnJob"("outfitId");

-- CreateIndex
CREATE INDEX "TryOnJob_expiresAt_idx" ON "TryOnJob"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "TryOnJob_userId_idempotencyKey_key" ON "TryOnJob"("userId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "TryOnResult_jobId_key" ON "TryOnResult"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "TryOnResult_storageKey_key" ON "TryOnResult"("storageKey");

-- CreateIndex
CREATE INDEX "TryOnResult_userId_createdAt_idx" ON "TryOnResult"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "TryOnResult_expiresAt_deletedAt_idx" ON "TryOnResult"("expiresAt", "deletedAt");

-- AddForeignKey
ALTER TABLE "TryOnConsent" ADD CONSTRAINT "TryOnConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnJob" ADD CONSTRAINT "TryOnJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnJob" ADD CONSTRAINT "TryOnJob_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "TryOnConsent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnJob" ADD CONSTRAINT "TryOnJob_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnJob" ADD CONSTRAINT "TryOnJob_wardrobeItemId_fkey" FOREIGN KEY ("wardrobeItemId") REFERENCES "WardrobeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnJob" ADD CONSTRAINT "TryOnJob_outfitId_fkey" FOREIGN KEY ("outfitId") REFERENCES "Outfit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnResult" ADD CONSTRAINT "TryOnResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "TryOnJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TryOnResult" ADD CONSTRAINT "TryOnResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
