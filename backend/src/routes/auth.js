const express = require("express")
const router = express.Router()
const prisma = require("../prisma");
const bcrypt = require("bcryptjs")



/* 🟢 REGISTRAR USUARIO (solo admin luego) */
router.post("/register", async (req, res) => {
  const { nombre, email, password, rol } = req.body

  const hashed = await bcrypt.hash(password, 10)

  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      email,
      password: hashed,
      rol
    }
  })

  res.json(usuario)
})

/* 🔐 LOGIN */
router.post("/login", async (req, res) => {
  const { email, password } = req.body

  const usuario = await prisma.usuario.findUnique({
    where: { email }
  })

  if (!usuario) {
    return res.status(401).json({ error: "Usuario no existe" })
  }

  const valido = await bcrypt.compare(password, usuario.password)

  if (!valido) {
    return res.status(401).json({ error: "Password incorrecto" })
  }

  res.json({
    id: usuario.id,
    nombre: usuario.nombre,
    rol: usuario.rol
  })
})

module.exports = router
