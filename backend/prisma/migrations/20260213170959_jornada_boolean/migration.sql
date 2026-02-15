/*
  Warnings:

  - The `estado` column on the `Jornada` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Jornada" DROP COLUMN "estado",
ADD COLUMN     "estado" BOOLEAN NOT NULL DEFAULT true;
