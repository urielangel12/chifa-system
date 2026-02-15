const express = require("express");
const router = express.Router();

const prisma = require("../prisma");

router.get("/", async (req, res) => {
  const platos = await prisma.plato.findMany();
  res.json(platos);
  });
  
router.post("/", async (req, res) => {
  const { nombre, precio, categoria, subcategoria } = req.body;

  if (!nombre || !precio || !categoria  || !subcategoria) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  const plato = await prisma.plato.create({
    data: {
      nombre,
      precio,
      categoria,
      subcategoria,
      
    }
  });

  res.json(plato);
});


module.exports = router;
