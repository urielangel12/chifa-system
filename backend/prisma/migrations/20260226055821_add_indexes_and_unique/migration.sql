/*
  Warnings:

  - A unique constraint covering the columns `[numero]` on the table `Mesa` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "Jornada_estado_idx" ON "Jornada"("estado");

-- CreateIndex
CREATE INDEX "Jornada_cierre_idx" ON "Jornada"("cierre");

-- CreateIndex
CREATE INDEX "Jornada_fecha_idx" ON "Jornada"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "Mesa_numero_key" ON "Mesa"("numero");

-- CreateIndex
CREATE INDEX "Mesa_numero_idx" ON "Mesa"("numero");

-- CreateIndex
CREATE INDEX "Pago_pedidoId_idx" ON "Pago"("pedidoId");

-- CreateIndex
CREATE INDEX "Pago_metodoPago_idx" ON "Pago"("metodoPago");

-- CreateIndex
CREATE INDEX "Pago_createdAt_idx" ON "Pago"("createdAt");

-- CreateIndex
CREATE INDEX "Pedido_estado_idx" ON "Pedido"("estado");

-- CreateIndex
CREATE INDEX "Pedido_mesaId_idx" ON "Pedido"("mesaId");

-- CreateIndex
CREATE INDEX "Pedido_jornadaId_idx" ON "Pedido"("jornadaId");

-- CreateIndex
CREATE INDEX "Pedido_estado_mesaId_idx" ON "Pedido"("estado", "mesaId");

-- CreateIndex
CREATE INDEX "Pedido_estado_jornadaId_idx" ON "Pedido"("estado", "jornadaId");

-- CreateIndex
CREATE INDEX "Pedido_createdAt_idx" ON "Pedido"("createdAt");

-- CreateIndex
CREATE INDEX "PedidoDetalle_pedidoId_idx" ON "PedidoDetalle"("pedidoId");

-- CreateIndex
CREATE INDEX "PedidoDetalle_platoId_idx" ON "PedidoDetalle"("platoId");
