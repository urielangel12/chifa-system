require("dotenv").config();
process.env.TZ = "America/Lima";

const express = require("express");
const cors = require("cors");

const app = express();

// ✅ CORS: local + prod (Vercel)
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Postman / server-to-server
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

app.use(express.json());

// ✅ Ruta raíz (para que "/" no asuste)
app.get("/", (req, res) => {
  res.json({ ok: true, msg: "Backend Restaurante System corriendo ✅" });
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

app.use("/api/reportes", reporteSemestral);
app.use("/api/reportes", reporteMensual);
app.use("/api/reportes", reporteDiario);
app.use("/api/jornada", jornadaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/caja", cajaRoutes);

app.use("/api/pedidos", pedidosRoutes);
app.use("/api/platos", platosRoutes);
app.use("/api/mesas", mesasRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
