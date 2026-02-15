const express = require("express");
const router = express.Router();
const prisma = require("../prisma");

const role = require("../middlewares/role")

router.get('/health', (req, res) => {
  res.json({ mensaje: 'API pedidos funcionando correctamente' })
})
/* 📋 LISTAR TODOS LOS PEDIDOS */
router.get('/', async (req, res) => {
  const pedidos = await prisma.pedido.findMany({
    include: {
      mesa: true,
      jornada: true,
      detalles: {
        include: {
          plato: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  res.json(pedidos)
})


/* 🟢 ABRIR PEDIDO POR MESA */
router.post("/abrir/:mesaId", async (req, res) => {
  // 🔍 buscar jornada abierta
const jornadaAbierta = await prisma.jornada.findFirst({
  where: { estado: true }
})

if (!jornadaAbierta) {
  return res.status(400).json({
    error: "No hay jornada abierta. Abra el local primero."
  })
  
}

  const mesaId = Number(req.params.mesaId);

  // 1️⃣ Verificar si la mesa existe
  const mesa = await prisma.mesa.findUnique({
    where: { id: mesaId }
  });

  if (!mesa) {
    return res.status(404).json({ error: "Mesa no existe" });
  }

  // 2️⃣ Si la mesa ya está ocupada → no abrir otro pedido
// 🔍 verificar si ya existe pedido abierto real (con detalles)
const pedidoAbierto = await prisma.pedido.findFirst({
  where: { mesaId, estado: "ABIERTO" },
  include: {
    mesa: true,
    detalles: { include: { plato: true } }
  }
});

if (pedidoAbierto) {
  // por si acaso la mesa quedó libre por un bug anterior
  await prisma.mesa.update({
    where: { id: mesaId },
    data: { estado: "OCUPADA" }
  });

  return res.json(pedidoAbierto);
}



  // 3️⃣ Crear pedido
  const pedido = await prisma.pedido.create({
  data: {
    mesaId,
    jornadaId: jornadaAbierta.id,
    estado: "ABIERTO",
    total:0
  }
});

  // 4️⃣ Ocupar mesa
  await prisma.mesa.update({
    where: { id: mesaId },
    data: { estado: "OCUPADA" }
  });

 const pedidoFull = await prisma.pedido.findUnique({
  where: { id: pedido.id },
  include: {
    mesa: true,
    detalles: { include: { plato: true } }
  }
});

res.json(pedidoFull);

});

/* ➕ AGREGAR PLATO AL PEDIDO */
router.post("/:pedidoId/agregar", async (req, res) => {
  const pedidoId = Number(req.params.pedidoId)
  if (!pedidoId || isNaN(pedidoId)) {
  return res.status(400).json({ error: "PedidoId inválido" })
}

  const { platoId, cantidad } = req.body
  
const pedido = await prisma.pedido.findUnique({
  where: { id: pedidoId }
})

if (!pedido) {
  return res.status(404).json({ error: "Pedido no existe" })
}

if (pedido.estado !== "ABIERTO") {
  return res.status(400).json({
    error: "No se puede modificar un pedido cerrado"
  })
}
  const plato = await prisma.plato.findUnique({
    where: { id: platoId }
  })

  if (!plato) {
    return res.status(404).json({ error: "Plato no existe" })
  }

  const precio = plato.precio

  // 🔍 1️⃣ buscar si ya existe el plato en el pedido
  const detalleExistente = await prisma.pedidoDetalle.findFirst({
    where: {
      pedidoId,
      platoId
    }
  })  

  if (detalleExistente) {
    // 🟢 2️⃣ actualizar cantidad
    const nuevaCantidad = detalleExistente.cantidad + cantidad
    const nuevoSubtotal = nuevaCantidad * precio

    await prisma.pedidoDetalle.update({
      where: { id: detalleExistente.id },
      data: {
        cantidad: nuevaCantidad,
        subtotal: nuevoSubtotal
      }
    })
  } else {
    // 🟢 3️⃣ crear nuevo detalle
    await prisma.pedidoDetalle.create({
      data: {
        pedidoId,
        platoId,
        cantidad,
        precio,
        subtotal: precio * cantidad
      }
    })
  }

  // 🔄 4️⃣ recalcular total
  const detalles = await prisma.pedidoDetalle.findMany({
    where: { pedidoId }
  })

  const total = detalles.reduce(
    (sum, d) => sum + d.subtotal,
    0
  )

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { total }
  })

  res.json({ mensaje: "Plato agregado correctamente", total })
})


/* 💰 CERRAR PEDIDO (PAGO TOTAL) */
router.post("/:pedidoId/cerrar", async (req, res) => {
  try {
    const pedidoId = Number(req.params.pedidoId);
    const { metodoPago } = req.body;

    if (!pedidoId || isNaN(pedidoId)) {
      return res.status(400).json({ mensaje: "PedidoId inválido" });
    }

    if (!metodoPago || !["EFECTIVO", "YAPE"].includes(metodoPago)) {
      return res.status(400).json({ mensaje: "Método de pago inválido" });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { mesa: true }
    });

    if (!pedido) {
      return res.status(404).json({ mensaje: "Pedido no existe" });
    }

    if (pedido.estado !== "ABIERTO") {
      return res.status(400).json({ mensaje: "El pedido ya fue cerrado" });
    }

    // ✅ Registrar pago total
    await prisma.pago.create({
      data: {
        pedidoId: pedido.id,
        monto: pedido.total,
        metodoPago,
        fechaCierre: new Date()
      }
    });

    // ✅ Marcar pedido como PAGADO
    const pedidoCerrado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: { estado: "PAGADO" }
    });

    // ✅ Liberar mesa
    await prisma.mesa.update({
      where: { id: pedido.mesaId },
      data: { estado: "LIBRE" }
    });

    return res.json({
      mensaje: "Pedido pagado correctamente",
      pedido: pedidoCerrado
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ mensaje: "Error al cerrar pedido" });
  }
});




/* 📋 VER PEDIDO ABIERTO POR MESA */
router.get("/mesa/:mesaId", async (req, res) => {
  try {
    const mesaId = Number(req.params.mesaId);

    if (!mesaId || isNaN(mesaId)) {
      return res.status(400).json({ message: "mesaId inválido" });
    }

    const pedido = await prisma.pedido.findFirst({
      where: {
        mesaId: mesaId,          // ✅ aquí estaba el fallo
        estado: "ABIERTO"
      },
      include: {
        mesa: true,              // ✅ útil para mostrar Mesa {numero}
        detalles: {
          include: {
            plato: true
          }
        }
      }
    });

    if (!pedido) {
      return res.status(404).json({ message: "No hay pedido abierto" });
    }

    return res.json(pedido);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error obteniendo pedido" });
  }
});



router.delete("/detalle/:detalleId", async (req, res) => {
  const detalleId = Number(req.params.detalleId)

  const detalle = await prisma.pedidoDetalle.findUnique({
    where: { id: detalleId },
    include: { pedido: true }
  })

  if (!detalle) {
    return res.status(404).json({ error: "Detalle no existe" })
  }

  if (detalle.pedido.estado !== "ABIERTO") {
    return res.status(400).json({
      error: "No se puede modificar un pedido pagado"
    })
  }

  await prisma.pedidoDetalle.delete({
    where: { id: detalleId }
  })

  // recalcular total
  const detalles = await prisma.pedidoDetalle.findMany({
    where: { pedidoId: detalle.pedidoId }
  })

  const total = detalles.reduce(
    (sum, d) => sum + d.precio * d.cantidad,
    0
  )

  await prisma.pedido.update({
    where: { id: detalle.pedidoId },
    data: { total }
  })

  res.json({ mensaje: "Plato eliminado correctamente", total })
})

router.delete("/:pedidoId/cancelar", async (req, res) => {
  try {
    const pedidoId = Number(req.params.pedidoId);

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { detalles: true }
    });

    if (!pedido) return res.status(404).json({ error: "Pedido no existe" });
    if (pedido.estado !== "ABIERTO")
      return res.status(400).json({ error: "Solo se cancela pedido ABIERTO" });

    // borrar detalles primero
    await prisma.pedidoDetalle.deleteMany({
      where: { pedidoId }
    });

    // borrar pagos parciales si hubiera (opcional)
    await prisma.pago.deleteMany({
      where: { pedidoId }
    });

    // borrar pedido
    await prisma.pedido.delete({
      where: { id: pedidoId }
    });

    // liberar mesa
    await prisma.mesa.update({
      where: { id: pedido.mesaId },
      data: { estado: "LIBRE" }
    });

    res.json({ mensaje: "Pedido cancelado y mesa liberada" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error cancelando pedido" });
  }
});

/* 📋 OBTENER PEDIDO POR ID */
router.get("/:id", async (req, res) => {
  const pedidoId = parseInt(req.params.id)

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
        detalles: {
        include: {
          plato: true
        }
      }, mesa:true
    }
  })

  if (!pedido) {
    return res.status(404).json({ error: "Pedido no encontrado" })
  }

  res.json(pedido)
})


/* ➖ RESTAR PLATO DEL PEDIDO */
router.post("/:pedidoId/detalles/restar", async (req, res) => {
  const pedidoId = Number(req.params.pedidoId)
  if (!pedidoId || isNaN(pedidoId)) {
  return res.status(400).json({ error: "PedidoId inválido" })
}

  const { platoId } = req.body

  const detalle = await prisma.pedidoDetalle.findFirst({
    where: { pedidoId, platoId }
  })

  if (!detalle) {
    return res.status(404).json({ error: "Detalle no encontrado" })
  }

  if (detalle.cantidad > 1) {
    await prisma.pedidoDetalle.update({
      where: { id: detalle.id },
      data: {
        cantidad: detalle.cantidad - 1,
        subtotal: (detalle.cantidad - 1) * detalle.precio
      }
    })
  } else {
    await prisma.pedidoDetalle.delete({
      where: { id: detalle.id }
    })
  }

  // 🔄 recalcular total
  const detalles = await prisma.pedidoDetalle.findMany({
    where: { pedidoId }
  })

  const total = detalles.reduce(
    (sum, d) => sum + d.subtotal,
    0
  )

  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { total }
  })

  res.json({ mensaje: "Plato restado correctamente", total })
})

router.post("/:id/pago", async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, metodoPago } = req.body;

    const pedido = await prisma.pedido.findUnique({
      where: { id: Number(id) },
      include: { pagos: true }
    });

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    if (pedido.estado === "PAGADO") {
      return res.status(400).json({ message: "Pedido ya pagado" });
    }

    // 1️⃣ Crear pago
    await prisma.pago.create({
      data: {
        pedidoId: pedido.id,
        monto: Number(monto),
        metodoPago
      }
    });

    // 2️⃣ Calcular total pagado
    const pagos = await prisma.pago.findMany({
      where: { pedidoId: pedido.id }
    });

    const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);
    const restante = pedido.total - totalPagado;

    // 3️⃣ Si ya pagaron todo
    if (totalPagado >= pedido.total) {
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: { estado: "PAGADO" }
      });

      await prisma.mesa.update({
        where: { id: pedido.mesaId },
        data: { estado: "LIBRE" }
      });
    }

    res.json({
      message: "Pago registrado",
      totalPagado,
      restante: restante < 0 ? 0 : restante
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar pago" });
  }
});

router.post("/:id/pago-items", async (req, res) => {
  try {
    const pedidoId = Number(req.params.id);
    const { items, metodoPago } = req.body;

    if (!metodoPago) {
      return res.status(400).json({ message: "Método de pago requerido" });
    }

    const pedido = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { detalles: true, mesa: true }
    });

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    if (pedido.estado === "PAGADO") {
      return res.status(400).json({ message: "Pedido ya pagado" });
    }

    let totalPago = 0;

    // 1️⃣ Actualizar cantidades pagadas
    for (const item of items) {

      const detalle = pedido.detalles.find(
        d => d.id === item.detalleId
      );

      if (!detalle) {
        return res.status(400).json({ message: "Detalle inválido" });
      }

      const pendiente = detalle.cantidad - detalle.cantidadPagada;

      if (item.cantidad > pendiente) {
        return res.status(400).json({
          message: "Cantidad mayor a lo pendiente"
        });
      }

      await prisma.pedidoDetalle.update({
        where: { id: detalle.id },
        data: {
          cantidadPagada: detalle.cantidadPagada + item.cantidad
        }
      });

      totalPago += item.cantidad * detalle.precio;
    }

    // 2️⃣ Registrar pago
    await prisma.pago.create({
      data: {
        pedidoId: pedido.id,
        monto: totalPago,
        metodoPago
      }
    });

    // 3️⃣ Verificar si todo está pagado
    const detallesActualizados = await prisma.pedidoDetalle.findMany({
      where: { pedidoId: pedido.id }
    });

    const completo = detallesActualizados.every(
      d => d.cantidadPagada >= d.cantidad
    );

   if (completo) {
  await prisma.pedido.update({
    where: { id: pedido.id },
    data: {
      estado: "PAGADO"
    }
  });


      await prisma.mesa.update({
        where: { id: pedido.mesaId },
        data: { estado: "LIBRE" }
      });
    }

    return res.json({
      message: "Pago registrado correctamente",
      cerrado: completo
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar pago" });
  }
});


module.exports = router;
