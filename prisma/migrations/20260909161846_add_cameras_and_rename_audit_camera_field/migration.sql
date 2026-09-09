-- CreateTable: cameras
CREATE TABLE "cameras" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "camera_ip" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 80,
    "protocol" TEXT NOT NULL DEFAULT 'http',
    "username" TEXT,
    "password" TEXT,
    "clip" INTEGER NOT NULL DEFAULT 0,
    "volume" INTEGER NOT NULL DEFAULT 100,
    "repeat" INTEGER NOT NULL DEFAULT 0,
    "audio_device_id" INTEGER NOT NULL DEFAULT 0,
    "audio_output_id" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cameras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique camera_ip
CREATE UNIQUE INDEX "cameras_camera_ip_key" ON "cameras"("camera_ip");

-- AlterTable: audit_logs — add camera_id column with a temporary default, then drop camera_ip
ALTER TABLE "audit_logs" ADD COLUMN "camera_id" TEXT NOT NULL DEFAULT 'legacy';

-- Backfill: set camera_id to the old camera_ip value for existing rows
UPDATE "audit_logs" SET "camera_id" = "camera_ip";

-- Remove the temporary default
ALTER TABLE "audit_logs" ALTER COLUMN "camera_id" DROP DEFAULT;

-- Drop old column and index
DROP INDEX IF EXISTS "audit_logs_camera_ip_idx";
ALTER TABLE "audit_logs" DROP COLUMN "camera_ip";

-- CreateIndex: camera_id on audit_logs
CREATE INDEX "audit_logs_camera_id_idx" ON "audit_logs"("camera_id");
