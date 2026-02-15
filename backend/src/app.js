require('dotenv').config();
const express = require('express');
const cors = require('cors');   // 👈 AÑADIR ESTO

const app = express();

// 🔥 CORS — ESTO ES LO QUE FALTABA
app.use(cors({
  origin: process.env.FRONTEND_URL || "*"
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


// 🔴 ESTA LÍNEA ES OBLIGATORIA
app.use(express.json());

const pedidosRoutes = require('./routes/pedidos');
const platosRoutes = require('./routes/platos');
const mesasRoutes = require('./routes/mesas');
const cajaRoutes = require("./routes/caja");
const authRoutes = require("./routes/auth");
const jornadaRoutes = require("./routes/jornada");
const reporteDiario = require("./routes/reporteDiario");
const reporteMensual = require("./routes/reporteMensual");
const reporteSemestral = require("./routes/reporteSemestral")

process.env.TZ = "America/Lima";

require('dotenv').config();



app.use("/api/reportes", reporteSemestral)
app.use("/api/reportes", reporteMensual);
app.use("/api/reportes", reporteDiario);
app.use("/api/jornada", jornadaRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/caja", cajaRoutes);

app.use('/api/pedidos', pedidosRoutes);
app.use('/api/platos', platosRoutes);
app.use('/api/mesas', mesasRoutes);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
