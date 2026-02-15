module.exports = (rolPermitido) => {
  return (req, res, next) => {
    const rol = req.headers["rol"]

    if (rol !== rolPermitido) {
      return res.status(403).json({ error: "Acceso denegado" })
    }

    next()
  }
}
