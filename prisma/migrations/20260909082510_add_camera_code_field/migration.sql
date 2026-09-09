/*
  Warnings:

  - A unique constraint covering the columns `[camera_code]` on the table `cameras` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `camera_code` to the `cameras` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cameras" ADD COLUMN     "camera_code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "cameras_camera_code_key" ON "cameras"("camera_code");
