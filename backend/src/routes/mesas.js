const express = require("express");
const router = express.Router();
const prisma = require("../prisma");

/* ➕ CREAR MESA (ÚNICO) */
router.post("/", async (req, res) => {
  try {
    const numero = Number(req.body.numero);

    if (!numero || Number.isNaN(numero)) {
      return res.status(400).json({ error: "Número de mesa requerido" });
    }

    const existe = await prisma.mesa.findFirst({
      where: { numero },
      select: { id: true }
    });

    if (existe) {
      return res.status(400).json({ error: "Mesa ya existe" });
    }

    const mesa = await prisma.mesa.create({
      data: { numero, estado: "LIBRE" },
      select: { id: true, numero: true, estado: true }
    });

    res.json(mesa);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error creando mesa" });
  }
});

/* 📋 LISTAR MESAS (OPTIMIZADO) */
router.get("/", async (req, res) => {
  try {
    const mesas = await prisma.mesa.findMany({
      select: { id: true, numero: true }, // ✅ solo lo necesario
      orderBy: { numero: "asc" }
    });

    // ✅ solo mesaId, sin traer todo el pedido
    const pedidosAbiertos = await prisma.pedido.findMany({
      where: { estado: "ABIERTO" },
      distinct: ["mesaId"],
      select: { mesaId: true }
    });

    const setOcupadas = new Set(pedidosAbiertos.map(p => p.mesaId));

    const resultado = mesas.map(m => ({
      id: m.id,
      numero: m.numero,
      estado: setOcupadas.has(m.id) ? "OCUPADA" : "LIBRE"
    }));

    // Para dashboards en tiempo real, mejor no cachear
    res.setHeader("Cache-Control", "no-store");
    res.json(resultado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error listando mesas" });
  }
});

/* 📊 DASHBOARD DE MESAS (si lo usas, también lo optimizamos) */
router.get("/dashboard", async (req, res) => {
  try {
    const mesas = await prisma.mesa.findMany({
      select: {
        id: true,
        numero: true,
        pedidos: {
          where: { estado: "ABIERTO" },
          select: { id: true, total: true, createdAt: true }
        }
      },
      orderBy: { numero: "asc" }
    });

    const resultado = mesas.map(m => ({
      id: m.id,
      numero: m.numero,
      estado: m.pedidos.length > 0 ? "OCUPADA" : "LIBRE",
      pedido: m.pedidos[0] || null
    }));

    res.setHeader("Cache-Control", "no-store");
    res.json(resultado);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error dashboard mesas" });
  }
});

module.exports = router;