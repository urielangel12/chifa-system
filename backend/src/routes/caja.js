const express = require("express")
const router = express.Router()
const prisma = require("../prisma");

/* 🟢 ABRIR CAJA */
router.post("/abrir", async (req, res) => {
  const { montoInicial } = req.body

  const cajaAbierta = await prisma.caja.findFirst({
    where: { estado: "ABIERTA" }
  })

  if (cajaAbierta) {
    return res.status(400).json({ error: "Ya hay una caja abierta" })
  }

  const caja = await prisma.caja.create({
    data: {
      montoInicial,
      estado: "ABIERTA"
    }
  })

  res.json(caja)
})

/* ➕ MOVIMIENTO */
router.post("/movimiento", async (req, res) => {
  const { tipo, concepto, monto } = req.body

  const caja = await prisma.caja.findFirst({
    where: { estado: "ABIERTA" }
  })

  if (!caja) {
    return res.status(400).json({ error: "No hay caja abierta" })
  }

  const movimiento = await prisma.movimientoCaja.create({
    data: {
      cajaId: caja.id,
      tipo,
      concepto,
      monto
    }
  })

  res.json(movimiento)
})

/* 🔴 CERRAR CAJA */
router.post("/cerrar", async (req, res) => {
  const caja = await prisma.caja.findFirst({
    where: { estado: "ABIERTA" },
    include: { movimientos: true }
  })

  if (!caja) {
    return res.status(400).json({ error: "No hay caja abierta" })
  }

  const totalIngresos = caja.movimientos
    .filter(m => m.tipo === "INGRESO")
    .reduce((s, m) => s + m.monto, 0)

  const totalEgresos = caja.movimientos
    .filter(m => m.tipo === "EGRESO")
    .reduce((s, m) => s + m.monto, 0)

  const montoFinal = caja.montoInicial + totalIngresos - totalEgresos

  await prisma.caja.update({
    where: { id: caja.id },
    data: {
      montoFinal,
      estado: "CERRADA"
    }
  })

  res.json({
    montoInicial: caja.montoInicial,
    ingresos: totalIngresos,
    egresos: totalEgresos,
    montoFinal
  })
})

module.exports = router
