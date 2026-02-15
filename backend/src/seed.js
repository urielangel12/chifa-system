require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // ✅ Crear 12 mesas (1..12)
  await prisma.mesa.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({
      numero: i + 1,
      estado: "LIBRE",
    })),
    skipDuplicates: true,
  });

  // ✅ Menú real (categoría + subcategoría)
  // Nota: uso Number(...) por si viene como string (ej: "3.5")
  const platos = [
    { nombre: "Pachamanca Chancho", precio: 20, categoria: "PACHAMANCA", subcategoria: "SABOR" },
    { nombre: "Pachamanca Pollo", precio: 20, categoria: "PACHAMANCA", subcategoria: "SABOR" },
    { nombre: "Pachamanca Cuy", precio: 22, categoria: "PACHAMANCA", subcategoria: "SABOR" },
    { nombre: "Pachamanca 2 Sabores (Cualquier sabor)", precio: 30, categoria: "PACHAMANCA", subcategoria: "COMBO" },
    { nombre: "Pachamanca 2 Sabores (Cualquier sabor + Cuy)", precio: 32, categoria: "PACHAMANCA", subcategoria: "COMBO" },

    { nombre: "Trucha Frita", precio: 18, categoria: "TRUCHA", subcategoria: "FRITA" },
    { nombre: "Trucha a la Parrilla", precio: 18, categoria: "TRUCHA", subcategoria: "PARRILLA" },
    { nombre: "Chicharrón de Trucha", precio: 24, categoria: "TRUCHA", subcategoria: "CHICHARRON" },
    { nombre: "Ceviche de Trucha", precio: 25, categoria: "TRUCHA", subcategoria: "CEVICHE" },
    { nombre: "Ceviche de Trucha con Chaufa", precio: 20, categoria: "TRUCHA", subcategoria: "CHAUFA" },
    { nombre: "Trucha Broaster", precio: 20, categoria: "TRUCHA", subcategoria: "BROASTER" },
    { nombre: "Sudado de Trucha", precio: 18, categoria: "TRUCHA", subcategoria: "SUDADO" },
    { nombre: "Trucha al Vapor", precio: 18, categoria: "TRUCHA", subcategoria: "VAPOR" },
    { nombre: "Mixto (Chaufa, Ceviche, Chicharrón)", precio: 30, categoria: "TRUCHA", subcategoria: "MIXTO" },

    { nombre: "Cuy Colorado", precio: 20, categoria: "OTROS", subcategoria: "COLORADO" },
    { nombre: "Chicharrón de Chancho", precio: 18, categoria: "OTROS", subcategoria: "COLORADO" },
    { nombre: "Chicharrón Colorado", precio: 18, categoria: "OTROS", subcategoria: "COLORADO" },
    { nombre: "Porción de Cancha", precio: 6, categoria: "OTROS", subcategoria: "PORCION" },
    { nombre: "Porción de Humita", precio: 7, categoria: "OTROS", subcategoria: "PORCION" },
    { nombre: "Taper", precio: 1, categoria: "OTROS", subcategoria: "PORCION" },

    { nombre: "J. Piña", precio: 6, categoria: "BEBIDAS", subcategoria: "JARRA" },
    { nombre: "J. Limonada", precio: 6, categoria: "BEBIDAS", subcategoria: "JARRA" },
    { nombre: "J. Frozen", precio: 6, categoria: "BEBIDAS", subcategoria: "JARRA" },
    { nombre: "J. Carambola", precio: 6, categoria: "BEBIDAS", subcategoria: "JARRA" },

    { nombre: "Mate de Menta", precio: 6, categoria: "BEBIDAS", subcategoria: "MATE" },
    { nombre: "Mate de Manzanilla", precio: 6, categoria: "BEBIDAS", subcategoria: "MATE" },
    { nombre: "Mate de Toronjil", precio: 6, categoria: "BEBIDAS", subcategoria: "MATE" },
    { nombre: "Kulen", precio: 6, categoria: "BEBIDAS", subcategoria: "MATE" },

    // GASEOSAS / AGUAS (las dejaste como BEBIDAS + GASEOSA)
    { nombre: "Inca Kola Personal", precio: 3.5, categoria: "BEBIDAS", subcategoria: "GASEOSA" },
    { nombre: "Inka Kola Gordita", precio: 5, categoria: "BEBIDAS", subcategoria: "GASEOSA" },
    { nombre: "Inca Kola 1L", precio: 8, categoria: "BEBIDAS", subcategoria: "GASEOSA" },
    { nombre: "Inca Kola 3 litros", precio: 15, categoria: "BEBIDAS", subcategoria: "GASEOSA" },

    { nombre: "Coca Cola Personal", precio: 3.5, categoria: "BEBIDAS", subcategoria: "GASEOSA" },
    { nombre: "Coca Cola 1L", precio: 8, categoria: "BEBIDAS", subcategoria: "GASEOSA" },

    { nombre: "Sporade", precio: 3.5, categoria: "BEBIDAS", subcategoria: "GASEOSA" },

    { nombre: "San Luis", precio: 2.5, categoria: "BEBIDAS", subcategoria: "GASEOSA" },
    { nombre: "San Mateo", precio: 2.5, categoria: "BEBIDAS", subcategoria: "GASEOSA" },
    { nombre: "Cleio", precio: 2, categoria: "BEBIDAS", subcategoria: "GASEOSA" },

    // CERVEZAS
    { nombre: "Cerveza Cristal", precio: 8, categoria: "BEBIDAS", subcategoria: "CERVEZA" },
    { nombre: "Cerveza Pilsen", precio: 8, categoria: "BEBIDAS", subcategoria: "CERVEZA" },
    { nombre: "Cerveza Cusqueña Dorada", precio: 10, categoria: "BEBIDAS", subcategoria: "CERVEZA" },
    { nombre: "Cerveza Cusqueña Trigo", precio: 10, categoria: "BEBIDAS", subcategoria: "CERVEZA" },
    { nombre: "Cerveza Cusqueña Negra", precio: 10, categoria: "BEBIDAS", subcategoria: "CERVEZA" },

    // HELADOS
    { nombre: "Fruto Rojo (EN CONO)", precio: 2, categoria: "HELADO", subcategoria: "HELADO" },
    { nombre: "Fruto Salvaje (EN CONO)", precio: 2, categoria: "HELADO", subcategoria: "HELADO" },
    { nombre: "MARACUMANGO (EN CONO)", precio: 2, categoria: "HELADO", subcategoria: "HELADO" },
    { nombre: "HELADO EN VASO (2 BOLAS)", precio: 3, categoria: "HELADO", subcategoria: "HELADO" },
    { nombre: "HELADO EN VASO (3 BOLAS)", precio: 5, categoria: "HELADO", subcategoria: "HELADO" },
  ].map((p) => ({
    ...p,
    // limpieza: por si copiaste raro
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
