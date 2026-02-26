require("dotenv").config();
process.env.TZ = "America/Lima";

const express = require("express");
const cors = require("cors");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL, // https://chifa-system.vercel.app
].filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // Postman / server-to-server
    if (allowedOrigins.includes(origin)) return cb(null, true);

    // ✅ permitir previews de Vercel (opcional pero recomendado)
    if (/\.vercel\.app$/.test(origin)) return cb(null, true);

    return cb(null, false); // no revienta el server
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("/*", cors(corsOptions)); // ✅ Express 5 compatible

app.use(express.json());

// ✅ Ruta raíz
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

app.use("/reportes", reporteSemestral);
app.use("/reportes", reporteMensual);
app.use("/reportes", reporteDiario);
app.use("/jornada", jornadaRoutes);
app.use("/auth", authRoutes);
app.use("/caja", cajaRoutes);
app.use("/pedidos", pedidosRoutes);
app.use("/platos", platosRoutes);
app.use("/mesas", mesasRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});