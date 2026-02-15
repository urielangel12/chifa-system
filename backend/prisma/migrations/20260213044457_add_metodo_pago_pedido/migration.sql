-- AlterTable
ALTER TABLE "Pago" ADD COLUMN     "fechaCierre" TIMESTAMP(3),
ALTER COLUMN "metodoPago" DROP NOT NULL;
