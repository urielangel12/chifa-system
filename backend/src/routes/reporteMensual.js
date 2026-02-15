const express = require("express")
const router = express.Router()
const ExcelJS = require("exceljs")
const prisma = require("../prisma")

router.get("/mensual", async (req, res) => {
  const { mes, anio } = req.query

  if (!mes || !anio) {
    return res.status(400).json({ error: "Mes y año requeridos" })
  }

 // Rango del mes en hora Perú (00:00 Perú = 05:00Z)
const inicio = new Date(`${anio}-${String(mes).padStart(2, "0")}-01T05:00:00.000Z`)
const finMes = Number(mes) === 12 ? 1 : Number(mes) + 1
const finAnio = Number(mes) === 12 ? Number(anio) + 1 : Number(anio)
const fin = new Date(`${finAnio}-${String(finMes).padStart(2, "0")}-01T05:00:00.000Z`)

  const jornadas = await prisma.jornada.findMany({
    where: {
      estado: false,
      cierre: { gte: inicio, lt: fin }
    },
    orderBy: { fecha: "asc" }
  })

  if (!jornadas.length) {
    return res.status(400).json({ error: "No hay jornadas cerradas" })
  }

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Reporte Mensual")

  sheet.columns = [
    { width: 12 },
    { width: 12 },
    ...Array(8).fill({ width: 12 }),
    { width: 14 },
    { width: 35 }
  ]

  // 🔷 TÍTULO
  sheet.mergeCells("A1:L1")
  sheet.getCell("A1").value = "REPORTE MENSUAL - LA GRUTA COCHARCAS"
  sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFF" } }
  sheet.getCell("A1").alignment = { horizontal: "center" }
  sheet.getCell("A1").fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "1F4E78" }
  }
  sheet.getRow(1).height = 30

  sheet.addRow([])

  // 🔷 CABECERA
  const headerRow = sheet.addRow([
    "FECHA","TIPO DÍA",
    "M1","M2","M3","M4","M5","M6","M7","M8",
    "TOTAL DÍA","OBSERVACIONES"
  ])

  headerRow.eachCell(cell => {
    cell.font = { bold: true }
    cell.alignment = { horizontal: "center", vertical: "middle" }
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "BDD7EE" }
    }
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    }
  })

  const resumen = []
let totalHelados = 0
let totalCerveza = 0
let totalGaseosa = 0
let totalPlatos = 0
let totalInsumos = 0

  for (const j of jornadas) {
  const pedidos = await prisma.pedido.findMany({
  where: { jornadaId: j.id, estado: "PAGADO" },
  include: {
    mesa: true,
    detalles: {
      include: {
        plato: true
      }
    }
  }
})

    const mesas = Array(8).fill("-")
    let totalDia = 0

pedidos.forEach(p => {
  const idx = p.mesa.numero - 1
  mesas[idx] = `S/ ${p.total.toFixed(2)}`
  totalDia += p.total

  // 🔥 TODAS LAS VENTAS SE SACAN DE LOS DETALLES
p.detalles.forEach(d => {
  const categoria = d.plato.categoria?.toUpperCase() || ""
  const subcategoria = d.plato.subcategoria?.toUpperCase() || ""
  const subtotal = d.subtotal

  // 🍦 HELADOS
  if (categoria.includes("HELADO")) {
    totalHelados += subtotal
  }

  // 🍽️ PLATOS (TODO LO QUE SEA COMIDA)
  else if (
    categoria.includes("PLATO") ||
    categoria.includes("PLATOS") ||
    categoria.includes("COMIDA") ||
    categoria.includes("MENU") ||
    categoria.includes("ALMUERZO")
  ) {
    totalPlatos += subtotal
  }

  // 🍺 CERVEZA
  else if (subcategoria.includes("CERVEZA")) {
    totalCerveza += subtotal
  }

  // 🥤 GASEOSA
  else if (subcategoria.includes("GASEOSA")) {
    totalGaseosa += subtotal
  }
})


})




    const row = sheet.addRow([
      new Date(j.fecha).toLocaleDateString("es-PE", { timeZone: "America/Lima" }),
      obtenerTipoDia(j.fecha),
      ...mesas,
      totalDia,
      j.observaciones || "Sin observaciones"
    ])

    row.eachCell((cell, col) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      }

      if (col === 11) {
        cell.numFmt = '"S/ "#,##0.00'
        cell.font = { bold: true }
      }

      if (col === 12) {
        cell.alignment = { wrapText: true }
      }
    })

    if (obtenerTipoDia(j.fecha) === "DOMINGO") {
      row.getCell(2).font = { bold: true, color: { argb: "C00000" } }
    }

    resumen.push({ fecha: j.fecha.toLocaleDateString(), total: totalDia })
  }

  // 🔷 ANÁLISIS
// =====================
// 📌 RESUMEN DEL MES
// =====================
sheet.addRow([])

const resumenTitle = sheet.addRow(["RESUMEN DEL MES"])
sheet.mergeCells(`A${resumenTitle.number}:L${resumenTitle.number}`)

resumenTitle.getCell(1).font = {
  bold: true,
  size: 14,
  color: { argb: "FFFFFF" }
}
resumenTitle.getCell(1).alignment = { horizontal: "center" }
resumenTitle.getCell(1).fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "2F5597" }
}
sheet.getRow(resumenTitle.number).height = 28

const ordenado = [...resumen].sort((a, b) => a.total - b.total)

const filaMenor = sheet.addRow([
  "Día con menor venta",
  ordenado[0].fecha,
  ordenado[0].total
])

const filaMayor = sheet.addRow([
  "Día con mayor venta",
  ordenado.at(-1).fecha,
  ordenado.at(-1).total
])

;[filaMenor, filaMayor].forEach(row => {
  row.eachCell(cell => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    }
  })

  row.getCell(1).font = { bold: true }
  row.getCell(3).numFmt = '"S/ "#,##0.00'
})

// =====================
// 🧾 TOTALES MENSUALES
// =====================
sheet.addRow([])

const totalesTitle = sheet.addRow(["TOTALES MENSUALES"])
sheet.mergeCells(`A${totalesTitle.number}:L${totalesTitle.number}`)

totalesTitle.getCell(1).font = {
  bold: true,
  size: 14,
  color: { argb: "FFFFFF" }
}
totalesTitle.getCell(1).alignment = { horizontal: "center" }
totalesTitle.getCell(1).fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "548235" }
}
sheet.getRow(totalesTitle.number).height = 26
const totalVentasMes =
  totalHelados +
  totalCerveza +
  totalGaseosa +
  totalPlatos

const gananciaMes = totalVentasMes - totalInsumos

const totalesMensuales = [
  ["Total venta helados", totalHelados],
  ["Total venta cerveza", totalCerveza],
  ["Total venta gaseosa", totalGaseosa],
  ["Total venta platos", totalPlatos],
  ["Total venta insumos", totalInsumos],
  ["GANANCIA TOTAL DEL MES", gananciaMes],
]


totalesMensuales.forEach(t => {
  const r = sheet.addRow([t[0], t[1]])
  sheet.mergeCells(`B${r.number}:L${r.number}`)

  r.getCell(2).numFmt = '"S/ "#,##0.00'
  r.getCell(1).font = { bold: true }

  // 🎯 estilo especial para ganancia
  if (t[0] === "GANANCIA TOTAL DEL MES") {
    r.getCell(1).font = { bold: true, color: { argb: "006100" } }
    r.getCell(2).font = { bold: true, color: { argb: "006100" } }
    r.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "C6EFCE" }
    }
    r.getCell(2).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "C6EFCE" }
    }
  }

  r.eachCell(cell => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    }
  })
})



  // 🔷 DATOS PARA GRÁFICO
  const chartSheet = workbook.addWorksheet("Datos Gráfico Ventas")
  chartSheet.columns = [
    { header: "FECHA", width: 15 },
    { header: "TOTAL VENTAS (S/)", width: 20 }
  ]
  ordenado.forEach(d => chartSheet.addRow([d.fecha, d.total]))
  chartSheet.getColumn(2).numFmt = '"S/ "#,##0.00'

  // 🔷 AJUSTES FINALES
  sheet.views = [{ state: "frozen", ySplit: 3 }]

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Reporte_Mensual_${mes}_${anio}.xlsx`
  )

  await workbook.xlsx.write(res)
  res.end()
})

function obtenerTipoDia(fecha) {
  const d = new Date(fecha)
  return d.getDay() === 0 ? "DOMINGO" : "NORMAL"
}

module.exports = router
