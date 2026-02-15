const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

router.get("/mesas", async (req, res) => {
  const mesas = await prisma.mesa.findMany();
  res.json(mesas);
});

router.post("/mesas", async (req, res) => {
  const { numero } = req.body;
  if (!numero) return res.status(400).json({ error: "Número requerido" });

  const nuevaMesa = await prisma.mesa.create({
    data: { numero, estado: "LIBRE" }
  });

  res.json(nuevaMesa);
});

router.put("/mesas/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const mesa = await prisma.mesa.update({
    where: { id: Number(id) },
    data: { estado }
  });

  res.json(mesa);
});

router.delete("/mesas/:id", async (req, res) => {
  const { id } = req.params;

  await prisma.mesa.delete({
    where: { id: Number(id) }
  });

  res.json({ mensaje: "Mesa eliminada" });
});

module.exports = router;
