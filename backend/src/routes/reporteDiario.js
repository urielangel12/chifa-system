const express = require("express")
const router = express.Router()

const ExcelJS = require("exceljs")

const prisma = require("../prisma");
  


router.get("/diario", async (req, res) => {

   function bordes(fila) {
  fila.eachCell(cell => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    }
  })
}



  // 1️⃣ Buscar última jornada cerrada
 const { fecha } = req.query

let jornada

if (fecha) {
  // fecha viene "2026-02-13"
  const [y, m, d] = fecha.split("-").map(Number);

  // inicio del día en Perú
  const inicio = new Date(y, m - 1, d, 0, 0, 0);

  // inicio del día siguiente en Perú
  const fin = new Date(y, m - 1, d + 1, 0, 0, 0);

  jornada = await prisma.jornada.findFirst({
    where: {
      estado: false,
      cierre: {
        gte: inicio,
        lt: fin
      }
    },
    orderBy: { cierre: "desc" }
  });
}
 else {
  jornada = await prisma.jornada.findFirst({
    where: { estado: false },
    orderBy: { cierre: "desc" }
  })
}



  if (!jornada) {
    return res.status(400).json({ error: "No hay jornada cerrada" })
  }


  
   const tipoDia = obtenerTipoDia(jornada.fecha)

  // 2️⃣ Obtener pedidos de la jornada
  const pedidos = await prisma.pedido.findMany({
    where: {
      jornadaId: jornada.id,
      estado: "PAGADO"
    },
    include: {
      mesa: true
    }
  })
const pagos = await prisma.pago.findMany({
  where: {
    pedido: {
      jornadaId: jornada.id,
      estado: "PAGADO"
    }
  },
  include: {
    pedido: {
      include: { mesa: true }
    }
  }
})
   // 3️⃣ Agrupar por mesa
const mesas = {}

pagos.forEach(p => {
  const mesaNum = p.pedido.mesa.numero

  if (!mesas[mesaNum]) {
    mesas[mesaNum] = {
      mesa: mesaNum,
      veces: 0,
      efectivo: 0,
      yape: 0
    }
  }
 
})



// 👉 Primero contar veces (desde pedidos)
pedidos.forEach(p => {
  const mesaNum = p.mesa.numero

  if (!mesas[mesaNum]) {
    mesas[mesaNum] = {
      mesa: mesaNum,
      veces: 0,
      efectivo: 0,
      yape: 0
    }
  }

  mesas[mesaNum].veces++
})

// 👉 Luego sumar pagos reales (desde tabla Pago)
pagos.forEach(p => {
  const mesaNum = p.pedido.mesa.numero

  if (!mesas[mesaNum]) {
    mesas[mesaNum] = {
      mesa: mesaNum,
      veces: 0,
      efectivo: 0,
      yape: 0
    }
  }

  if (p.metodoPago === "EFECTIVO") {
    mesas[mesaNum].efectivo += p.monto
  }

  if (p.metodoPago === "YAPE") {
    mesas[mesaNum].yape += p.monto
  }
})


  // 4️⃣ Crear Excel
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet("Reporte Diario")

  sheet.columns = [
  { width: 12 }, // Mesa
  { width: 10 }, // Veces
  { width: 15 }, // Efectivo
  { width: 15 }, // Yape
  { width: 15 }, // Total mesa
  { width: 5 },
  { width: 20 }
]

  // 🏷️ TÍTULO
  sheet.mergeCells("A1:E1")
  sheet.getCell("A1").value = "VELAMI - SNAILIS"
  sheet.getCell("A1").font = { size: 16, bold: true }
  sheet.getCell("A1").alignment = { horizontal: "center" }

  sheet.mergeCells("A2:E2")
 const fechaPE = new Date(jornada.fecha).toLocaleDateString("es-PE", {
  timeZone: "America/Lima"
});

sheet.getCell("A2").value = `FECHA: ${fechaPE}`;

  sheet.getCell("A2").alignment = { horizontal: "center" }

  sheet.mergeCells("A3:E3")
  sheet.getCell("A3").value = `TIPO DE DÍA: ${tipoDia}`
  sheet.getCell("A3").alignment = { horizontal: "center" }

  sheet.addRow([])

  // 📊 CABECERA TABLA
  sheet.addRow([
    "MESA",
    "VECES",
    "EFECTIVO",
    "YAPE",
    "TOTAL MESA"
  ]).font = { bold: true }

  let totalVentas = 0
let totalEfectivo = 0
let totalYape = 0
let totalVeces = 0

  // 📊 FILAS

 
 Object.values(mesas).forEach(m => {
  const totalMesa = m.efectivo + m.yape

  const row = sheet.addRow([
    m.mesa,
    m.veces,
    m.efectivo,
    m.yape,
    totalMesa
  ])

  // formato moneda
  row.getCell(3).numFmt = '"S/ " #,##0.00'
  row.getCell(4).numFmt = '"S/ " #,##0.00'
  row.getCell(5).numFmt = '"S/ " #,##0.00'

  // bordes
  bordes(row)

  totalVentas += totalMesa
  totalEfectivo += m.efectivo
  totalYape += m.yape
  totalVeces += m.veces
})


  // 📌 RESUMEN FINAL
// 📌 RESUMEN FINAL
sheet.addRow([])

const resumenTitle = sheet.addRow(["RESUMEN FINAL"])
sheet.mergeCells(`A${resumenTitle.number}:B${resumenTitle.number}`)
resumenTitle.font = { bold: true }
resumenTitle.alignment = { horizontal: "center" }
resumenTitle.eachCell(cell => {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "D9D9D9" }
  }
  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  }
})

// filas resumen
const rVentas  = sheet.addRow(["TOTAL VENTAS", totalVentas])

;[rVentas].forEach(r => {
  r.font = { bold: true }
  r.getCell(2).numFmt = '"S/ " #,##0.00'
  bordes(r)
})

// costo y ganancia
const rCosto = sheet.addRow(["COSTO INSUMOS", ""])
bordes(rCosto)

const rGanancia = sheet.addRow([
  "GANANCIA REAL",
  `=($B$${rVentas.number}-$B$${rCosto.number})`
])

rGanancia.font = { bold: true }
rGanancia.getCell(2).numFmt = '"S/ " #,##0.00'
bordes(rGanancia)

// totales finales
const rMesas = sheet.addRow(["TOTAL MESAS ATENDIDAS", Object.keys(mesas).length])
const rVeces = sheet.addRow(["TOTAL VECES", totalVeces])
const rEfec  = sheet.addRow(["TOTAL EFECTIVO", totalEfectivo])
const rYape  = sheet.addRow(["TOTAL YAPE", totalYape])

// Mesas y veces NO son dinero
rMesas.getCell(2).numFmt = '0'
rVeces.getCell(2).numFmt = '0'
bordes(rMesas)
bordes(rVeces)

// Efectivo y Yape sí son dinero
rEfec.getCell(2).numFmt = '"S/ " #,##0.00'
rYape.getCell(2).numFmt = '"S/ " #,##0.00'
bordes(rEfec)
bordes(rYape)




  // 📝 OBSERVACIONES
sheet.addRow([])

const obsTitle = sheet.addRow(["OBSERVACIONES DEL DÍA"])
sheet.mergeCells(`A${obsTitle.number}:E${obsTitle.number}`)

obsTitle.font = { bold: true }
obsTitle.alignment = { horizontal: "center" }
obsTitle.eachCell(cell => {
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "D9D9D9" }
  }
  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  }
})

const obsRow = sheet.addRow([jornada.observaciones || "Sin observaciones"])
sheet.mergeCells(`A${obsRow.number}:E${obsRow.number}`)

obsRow.alignment = { wrapText: true }
bordes(obsRow)


  // 5️⃣ Descargar
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Reporte_Diario_${jornada.id}.xlsx`
  )

  await workbook.xlsx.write(res)
  res.end()
})

function obtenerTipoDia(fecha) {
  const dias = [
    "DOMINGO",
    "LUNES",
    "MARTES",
    "MIÉRCOLES",
    "JUEVES",
    "VIERNES",
    "SÁBADO"
  ]

  const d = new Date(fecha)
  const dia = dias[d.getDay()]

  if (d.getDay() === 0) return "DOMINGO"
  return `FERIADO / ${dia}`
}


module.exports = router
