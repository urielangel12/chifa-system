const express = require("express");
const router = express.Router();
const prisma = require("../prisma");

/* 🟢 ABRIR JORNADA */
/* 🟢 ABRIR JORNADA */
router.post("/abrir", async (req, res) => {

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  // 🔎 Buscar jornada ABIERTA SOLO de hoy
  const jornadaHoy = await prisma.jornada.findFirst({
    where: {
      estado: true,
      fecha: {
        gte: hoy,
        lt: manana
      }
    }
  });

  if (jornadaHoy) {
    return res.json(jornadaHoy);
  }

  // 🔎 Verificar si existe jornada abierta vieja (error del sistema)
  const jornadaVieja = await prisma.jornada.findFirst({
    where: { 
      estado: true,
    fecha: {lt: hoy} }
  });

  if (jornadaVieja) {
    // La cerramos automáticamente para evitar contaminación
    await prisma.jornada.update({
      where: { id: jornadaVieja.id },
      data: {
        estado: false,
        cierre: new Date()
      }
    });
  }

  // Crear nueva jornada limpia
  const jornadaNueva = await prisma.jornada.create({
    data: {
      fecha: hoy,
      estado: true,
      observaciones: "NORMAL"
    }
  });

  res.json(jornadaNueva);
});


/* 🔴 CERRAR JORNADA */

router.post("/cerrar", async (req, res) => {
  try {
    const { observaciones } = req.body || {};


    const jornada = await prisma.jornada.findFirst({
      where: { estado: true } // si tu estado es boolean
    });

    if (!jornada) {
      return res.status(400).json({ mensaje: "No hay jornada abierta" });
    }

    const pedidosPendientes = await prisma.pedido.count({
      where: {
        jornadaId: jornada.id,
        estado: { not: "PAGADO" }
      }
    });

    if (pedidosPendientes > 0) {
      return res.status(400).json({ mensaje: "Existen pedidos pendientes" });
    }

    const mesasOcupadas = await prisma.mesa.count({
      where: { estado: "OCUPADA" }
    });

    if (mesasOcupadas > 0) {
      return res.status(400).json({ mensaje: "Existen mesas aún ocupadas" });
    }

    await prisma.jornada.update({
      where: { id: jornada.id },
      data: {
        estado: false,
        cierre: new Date(),
        observaciones: (observaciones || "").trim() || null
      }
    });

    return res.json({ mensaje: "Jornada cerrada correctamente" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error interno al cerrar jornada" });
  }
});





/* 📋 LISTAR JORNADAS (DEBUG /  ADMIN) */
router.get("/", async (req, res) => {
  const jornadas = await prisma.jornada.findMany({
    orderBy: { fecha: "desc" }
  })
  res.json(jornadas)
})

router.get("/health", (req, res) => {
  res.json({ mensaje: "API jornadas funcionando" })
})

router.get("/actual", async (req, res) => {
  try {
    const jornada = await prisma.jornada.findFirst({
      where: { 
        estado: true
      }
    });

    if (!jornada) {
      return res.status(404).json({ error: "No hay jornada activa" });
    }

    res.json(jornada);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener jornada actual" });
  }
});


module.exports = router;
