const express = require("express")
const router = express.Router()
const ExcelJS = require("exceljs")
const prisma = require("../prisma")
const { Prisma } = require("@prisma/client")


const headerStyle = {
  font: { bold: true, color: { argb: "FFFFFF" } },
  alignment: { horizontal: "center", vertical: "middle" },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "1F4E78" } },
  border: {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  }
}

const subHeaderStyle = {
  font: { bold: true },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "D9E1F2" } },
  alignment: { horizontal: "center" },
  border: {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" }
  }
}

router.get("/semestral", async (req, res) => {
  try {
    const { anio, semestre } = req.query

    if (!anio || !semestre) {
      return res.status(400).json({ error: "Debe indicar año y semestre (1 o 2)" })
    }

    const inicioMes = semestre == 1 ? 1 : 7
    const finMes = semestre == 1 ? 6 : 12

    const inicio = new Date(`${anio}-${String(inicioMes).padStart(2, "0")}-01T05:00:00.000Z`)
    const fin = new Date(`${anio}-${String(finMes + 1).padStart(2, "0")}-01T05:00:00.000Z`)

    // 🔍 Jornadas cerradas del semestre
    const jornadas = await prisma.jornada.findMany({
      where: {
        estado: false,
        cierre: { gte: inicio, lt: fin }
      },
      orderBy: { cierre: "asc" }
    })

    if (jornadas.length === 0) {
      return res.status(400).json({ error: "No hay jornadas cerradas en el semestre" })
    }

    const jornadaIds = jornadas.map(j => j.id)

    // 💰 Ventas por día
    const ventasDia = await prisma.$queryRaw`
      SELECT 
        j.fecha,
        SUM(p.total) AS total
      FROM "Jornada" j
      JOIN "Pedido" p ON p."jornadaId" = j.id
      WHERE j.id IN (${Prisma.join(jornadaIds)})
      AND p.estado = 'PAGADO'
      GROUP BY j.fecha
    `

    let totalVentas = 0
    ventasDia.forEach(v => totalVentas += Number(v.total))

    const mejorDia = ventasDia.reduce((a,b)=> Number(b.total) > Number(a.total) ? b : a)
    const peorDia = ventasDia.reduce((a,b)=> Number(b.total) < Number(a.total) ? b : a)

    // 📆 Domingos / feriados
    let domingos = 0
    let feriados = 0

    jornadas.forEach(j => {
      const fechaPE = new Date(j.fecha).toLocaleString("en-US", { timeZone: "America/Lima" })
const d = new Date(fechaPE)
d.getDay() === 0 ? domingos++ : feriados++

    })

    // 📊 Ventas por mes
    const ventasMes = await prisma.$queryRaw`
      SELECT 
        EXTRACT(MONTH FROM j.fecha) AS mes,
        COUNT(DISTINCT j.id) AS dias,
        SUM(p.total) AS total
      FROM "Jornada" j
      JOIN "Pedido" p ON p."jornadaId" = j.id
      WHERE j.id IN (${Prisma.join(jornadaIds)})
      AND p.estado = 'PAGADO'
      GROUP BY mes
      ORDER BY mes
    `

    // 🍽️ Platos vendidos semestre
    const platos = await prisma.$queryRaw`
      SELECT 
        pl.nombre,
        SUM(pd.cantidad) AS cantidad,
        SUM(pd.subtotal) AS ingresos
      FROM "PedidoDetalle" pd
      JOIN "Pedido" p ON p.id = pd."pedidoId"
      JOIN "Plato" pl ON pl.id = pd."platoId"
      WHERE p."jornadaId" IN (${Prisma.join(jornadaIds)})
      AND p.estado = 'PAGADO'
      GROUP BY pl.nombre
      ORDER BY ingresos DESC
    `

    // 📘 Excel
    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet("Reporte Semestral")
    ws.columns = [
  { width: 35 },
  { width: 20 },
  { width: 20 },
  { width: 20 }
]
ws.views = [{ state: "frozen", ySplit: 4 }]

ws.mergeCells("A1:D1")
ws.getCell("A1").value = "REPORTE SEMESTRAL - LA GRUTA COCHARCAS"
Object.assign(ws.getCell("A1"), headerStyle)
ws.getRow(1).height = 30

ws.mergeCells("A2:D2")
ws.getCell("A2").value =
  semestre == 1
    ? `PERIODO: ENERO - JUNIO ${anio}`
    : `PERIODO: JULIO - DICIEMBRE ${anio}`

ws.getCell("A2").alignment = { horizontal: "center" }
ws.getCell("A2").font = { italic: true }


    ws.addRow([])
const resumenTitle = ws.addRow(["RESUMEN EJECUTIVO"])
ws.mergeCells(`A${resumenTitle.number}:D${resumenTitle.number}`)
Object.assign(resumenTitle.getCell(1), headerStyle)

const resumenHeader = ws.addRow(["CONCEPTO", "VALOR", "", ""])


resumenHeader.eachCell(c => Object.assign(c, subHeaderStyle))


 const resumenData = [
  ["TOTAL VENTAS SEMESTRE", totalVentas],
  ["DÍAS ATENDIDOS (DOMINGOS)", domingos],
  ["FERIADOS ATENDIDOS", feriados],
  ["TOTAL DÍAS LABORADOS", domingos + feriados],
  [
    "PROMEDIO POR DÍA",
    (domingos + feriados) === 0
      ? 0
      : totalVentas / (domingos + feriados)
  ],
  ["MEJOR DÍA", Number(mejorDia.total)],
  ["PEOR DÍA", Number(peorDia.total)]
]


resumenData.forEach(r => {
  const row = ws.addRow(r)

  row.eachCell(cell => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    }
  })

  if (
    r[0].includes("VENTAS") ||
    r[0].includes("PROMEDIO") ||
    r[0].includes("MEJOR") ||
    r[0].includes("PEOR")
  ) {
    row.getCell(2).numFmt = '"S/ "#,##0.00'
  }
})



    // 📊 Ventas por mes
ws.addRow([])
const vmTitle = ws.addRow(["VENTAS POR MES"])
ws.mergeCells(`A${vmTitle.number}:D${vmTitle.number}`)
Object.assign(vmTitle.getCell(1), headerStyle)

const vmHeader = ws.addRow(["MES", "DÍAS TRABAJADOS", "TOTAL VENTAS"])
vmHeader.eachCell(c => Object.assign(c, subHeaderStyle))

ventasMes.forEach(v => {
  const r = ws.addRow([
    obtenerMes(Number(v.mes)),
    Number(v.dias),
    Number(v.total)
  ])
  r.getCell(3).numFmt = '"S/ "#,##0.00'
  r.eachCell(cell => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    }
  })
})


    // 🍽️ Platos
  ws.addRow([])
const platosTitle = ws.addRow(["PLATOS MÁS VENDIDOS DEL SEMESTRE"])
ws.mergeCells(`A${platosTitle.number}:D${platosTitle.number}`)
Object.assign(platosTitle.getCell(1), headerStyle)

const platosHeader = ws.addRow(["PLATO", "CANTIDAD", "INGRESOS"])
platosHeader.eachCell(c => Object.assign(c, subHeaderStyle))

platos.forEach(p => {
  const r = ws.addRow([
    p.nombre,
    Number(p.cantidad),
    Number(p.ingresos)
  ])
  r.getCell(3).numFmt = '"S/ "#,##0.00'
  r.eachCell(cell => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    }
  })
})


   

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Reporte_Semestral_${anio}_S${semestre}.xlsx`
    )

    await wb.xlsx.write(res)
    res.end()

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

function obtenerMes(m) {
  return [
    "", "ENERO","FEBRERO","MARZO","ABRIL","MAYO","JUNIO",
    "JULIO","AGOSTO","SEPTIEMBRE","OCTUBRE","NOVIEMBRE","DICIEMBRE"
  ][m]
}


module.exports = router
