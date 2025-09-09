-- CreateTable
CREATE TABLE "Pill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "generic_name" TEXT,
    "brand_name" TEXT,
    "strength" TEXT,
    "dosage_form" TEXT,
    "imprint_raw" TEXT,
    "imprint_norm" TEXT,
    "shape" TEXT,
    "color" TEXT,
    "scored" BOOLEAN,
    "image_url" TEXT,
    "image_url_back" TEXT,
    "manufacturer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Pill_imprint_norm_idx" ON "Pill"("imprint_norm");

-- CreateIndex
CREATE INDEX "Pill_shape_color_scored_idx" ON "Pill"("shape", "color", "scored");
