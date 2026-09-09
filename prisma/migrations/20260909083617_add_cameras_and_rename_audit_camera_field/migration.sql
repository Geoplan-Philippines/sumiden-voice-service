/*
  Warnings:

  - You are about to drop the column `camera_ip` on the `audit_logs` table. All the data in the column will be lost.
  - Added the required column `camera_id` to the `audit_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "audit_logs_camera_ip_idx";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "camera_ip",
ADD COLUMN     "camera_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "cameras" (
    "id" TEXT NOT NULL,
    "camera_code" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "cameras_camera_code_key" ON "cameras"("camera_code");

-- CreateIndex
CREATE UNIQUE INDEX "cameras_camera_ip_key" ON "cameras"("camera_ip");

-- CreateIndex
CREATE INDEX "audit_logs_camera_id_idx" ON "audit_logs"("camera_id");
