const express = require("express");
const router = express.Router();
const prisma = require("../prisma");

/* ➕ CREAR MESA */
router.post("/", async (req, res) => {
  const { numero } = req.body;

  if (!numero) {
    return res.status(400).json({ error: "Número de mesa requerido" });
  }

  const existe = await prisma.mesa.findFirst({
    where: { numero }
  });

  if (existe) {
    return res.status(400).json({ error: "Mesa ya existe" });
  }

  const mesa = await prisma.mesa.create({
    data: {
      numero,
      estado: "LIBRE"
    }
  });

  res.json(mesa);
});

/* 📋 LISTAR MESAS */
router.get("/", async (req, res) => {
  const mesas = await prisma.mesa.findMany({
    orderBy: { numero: "asc" }
  });

  const pedidosAbiertos = await prisma.pedido.findMany({
    where: { estado: "ABIERTO" },
    select: { mesaId: true }
  });

  const setOcupadas = new Set(pedidosAbiertos.map(p => p.mesaId));

  const resultado = mesas.map(m => ({
    ...m,
    estado: setOcupadas.has(m.id) ? "OCUPADA" : "LIBRE"
  }));

  res.json(resultado);
});


/* 📊 DASHBOARD DE MESAS */
router.get("/dashboard", async (req, res) => {
  const mesas = await prisma.mesa.findMany({
    include: {
      pedidos: {
        where: { estado: "ABIERTO" },
        select: {
          id: true,
          total: true,
          createdAt: true
        }
      }
    }
  });

  const resultado = mesas.map(mesa => ({
    id: mesa.id,
    numero: mesa.numero,
    estado: mesa.estado,
    pedido: mesa.pedidos.length > 0 ? mesa.pedidos[0] : null
  }));

  res.json(resultado);
});
/* ➕ CREAR MESA */
router.post("/", async (req, res) => {
  const { numero } = req.body;

  const mesaExistente = await prisma.mesa.findFirst({
    where: { numero }
  });

  if (mesaExistente) {
    return res.status(400).json({ error: "La mesa ya existe" });
  }

  const mesa = await prisma.mesa.create({
    data: {
      numero,
      estado: "LIBRE"
    }
  });

  res.json(mesa);
});

module.exports = router;
