require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // ✅ Crear 12 mesas (1..12)
  await prisma.mesa.createMany({
    data: Array.from({ length: 24 }, (_, i) => ({
      numero: i + 1,
      estado: "LIBRE",
    })),
    skipDuplicates: true,
  });

 // ✅ MENÚ CHIFA (con precios reales)
const platos = [
  // SALCHIS
  { nombre: "Salchipapas", precio: 4.5, categoria: "SALCHIS", subcategoria: "SALCHIPAPA" },
  { nombre: "Salchipollo", precio: 7.0, categoria: "SALCHIS", subcategoria: "SALCHIPOLLO" },

  // POLLO
  { nombre: "Alitas a la BBQ", precio: 12.0, categoria: "POLLO", subcategoria: "ALITAS" },
  { nombre: "Nuggets de Pollo", precio: 12.0, categoria: "POLLO", subcategoria: "NUGGETS" },

  // MARISCOS
  { nombre: "Langostinos en salsa de maracuyá", precio: 15.0, categoria: "MARISCOS", subcategoria: "LANGOSTINOS" },

  // BROASTER
  { nombre: "Broasters 1/4", precio: 11.0, categoria: "BROASTER", subcategoria: "1/4" },
  { nombre: "Broasters 1/8", precio: 8.0, categoria: "BROASTER", subcategoria: "1/8" },

  // ARROCES (CHIFA)
  { nombre: "Chaufa de Pollo", precio: 7.0, categoria: "CHIFA", subcategoria: "CHAUFA" },
  { nombre: "Aeropuerto de Pollo", precio: 10.0, categoria: "CHIFA", subcategoria: "AEROPUERTO" },

  // HAMBURGUESAS
  { nombre: "Hamburguesa de Pollo", precio: 3.5, categoria: "HAMBURGUESAS", subcategoria: "POLLO" },
  { nombre: "Hamburguesa de Carne", precio: 3.5, categoria: "HAMBURGUESAS", subcategoria: "CARNE" },
  { nombre: "Hamburguesa Clásica", precio: 8.0, categoria: "HAMBURGUESAS", subcategoria: "CLASICA" },

  // MAKIS
  { nombre: "Makis Crocantes", precio: 12.0, categoria: "MAKIS", subcategoria: "CROCANTE" },
  { nombre: "Uromakis", precio: 19.0, categoria: "MAKIS", subcategoria: "UROMAKI" },

  // BEBIDAS
  { nombre: "Jugo de Mango", precio: 3.5, categoria: "BEBIDAS", subcategoria: "JUGO" },
  { nombre: "Jugo de Fresas", precio: 3.5, categoria: "BEBIDAS", subcategoria: "JUGO" },
  { nombre: "Café", precio: 1.5, categoria: "BEBIDAS", subcategoria: "CALIENTE" },
  { nombre: "Té", precio: 1.0, categoria: "BEBIDAS", subcategoria: "CALIENTE" },

  // SOPAS
  { nombre: "Dakgaejang (sopa picante de pollo)", precio: 10.0, categoria: "SOPAS", subcategoria: "POLLO" },
].map((p) => ({
  ...p,
  nombre: String(p.nombre).trim(),
  categoria: String(p.categoria).trim().toUpperCase(),
  subcategoria: p.subcategoria ? String(p.subcategoria).trim().toUpperCase() : null,
  precio: Number(p.precio),
}));

  await prisma.plato.createMany({
    data: platos,
    skipDuplicates: true,
  });

  console.log("✅ Seed ejecutado: 12 mesas + menú completo insertados (sin duplicar)");
}

main()
  .catch((e) => console.error("❌ Seed error:", e))
  .finally(async () => {
    await prisma.$disconnect();
  });
