require("dotenv").config();
process.env.TZ = "America/Lima";

const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Orígenes permitidos
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL, // EJ: https://chifa-system.vercel.app
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    // requests sin origin (Postman, server-to-server)
    if (!origin) return cb(null, true);

    // exact match
    if (allowedOrigins.includes(origin)) return cb(null, true);

    // ✅ permite previews de Vercel (opcional)
    if (/\.vercel\.app$/.test(origin)) return cb(null, true);

    // ❌ no permitido, pero NO revientes con error (evita 500)
    return cb(null, false);
  },
  credentials: true,
};

// ✅ CORS para todas las rutas
app.use(cors(corsOptions));

// ✅ Preflight (OPTIONS) SIN wildcard de Express (para evitar error en Express 5)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    // aplica los headers CORS correspondientes
    return cors(corsOptions)(req, res, () => res.sendStatus(204));
  }
  next();
});

app.use(express.json());

// ✅ Ruta raíz
app.get("/", (req, res) => {
  res.json({ ok: true, msg: "Backend CHIFA System corriendo ✅" });
});

// Routes
const pedidosRoutes = require("./routes/pedidos");
const platosRoutes = require("./routes/platos");
const mesasRoutes = require("./routes/mesas");
const cajaRoutes = require("./routes/caja");
const authRoutes = require("./routes/auth");
const jornadaRoutes = require("./routes/jornada");
const reporteDiario = require("./routes/reporteDiario");
const reporteMensual = require("./routes/reporteMensual");
const reporteSemestral = require("./routes/reporteSemestral");

app.use("/reportes", reporteSemestral);
app.use("/reportes", reporteMensual);
app.use("/reportes", reporteDiario);

app.use("/jornada", jornadaRoutes);
app.use("/auth", authRoutes);
app.use("/caja", cajaRoutes);

app.use("/pedidos", pedidosRoutes);
app.use("/platos", platosRoutes);
app.use("/mesas", mesasRoutes);

// ✅ 404
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});