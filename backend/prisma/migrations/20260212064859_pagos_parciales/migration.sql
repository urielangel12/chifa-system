/*
  Warnings:

  - You are about to drop the column `metodoPago` on the `Pedido` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Pedido" DROP COLUMN "metodoPago";

-- CreateTable
CREATE TABLE "Pago" (
    "id" SERIAL NOT NULL,
    "pedidoId" INTEGER NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "metodoPago" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
