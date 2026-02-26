-- DropIndex
DROP INDEX "Mesa_numero_idx";

-- DropIndex
DROP INDEX "PedidoDetalle_pedidoId_idx";

-- DropIndex
DROP INDEX "PedidoDetalle_platoId_idx";

-- AlterTable
ALTER TABLE "Plato" ALTER COLUMN "subcategoria" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "MovimientoCaja_cajaId_idx" ON "MovimientoCaja"("cajaId");

-- CreateIndex
CREATE INDEX "PedidoDetalle_pedidoId_platoId_idx" ON "PedidoDetalle"("pedidoId", "platoId");
