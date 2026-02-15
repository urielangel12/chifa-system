import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

export default function MesaDetalle() {
  const { id } = useParams(); // ✅ como tu ruta es /mesas/:id
  const mesaId = id;
  const navigate = useNavigate();
  if (!mesaId) {
  return (
    <div className="min-h-screen bg-[#F7F2E8] p-6">
      Error: mesaId inválido. Revisa la ruta /mesas/:id
    </div>
  );
}


  const [pedido, setPedido] = useState(null);
  const [platos, setPlatos] = useState([]);
  const [tab, setTab] = useState("PACHAMANCAS");
// valores: PACHAMANCAS | TRUCHA | BEBIDAS | GASEOSAS | CERVEZAS | HELADOS | OTROS

  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(true);
  const [accionando, setAccionando] = useState(false);

  const [toast, setToast] = useState(null); // { type: "success"|"error"|"info", msg: string }

  const showToast = (type, msg, ms = 1600) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), ms);
  };

  const cargarPlatos = async () => {
    const res = await api.get("/platos");
    setPlatos(res.data || []);
  };

  const cargarPedidoAbierto = async () => {
  try {
    const res = await api.get(`/pedidos/mesa/${mesaId}`);
    setPedido(res.data); // existe pedido abierto
  } catch (err) {
    if (err.response?.status === 404) {
      setPedido(null); // no hay pedido, pero NO lo creamos aquí
    } else {
      console.error(err);
      showToast("error", "Error cargando el pedido");
    }
  }
};


 const refrescarPedido = async (pedidoId) => {
  try {
    const res = await api.get(`/pedidos/${pedidoId}`);
    setPedido(res.data);
  } catch (e) {
    console.error(e);
  }
};
useEffect(() => {
  const onFocus = async () => {
    try {
      if (pedido?.id) await refrescarPedido(pedido.id);
      else await cargarPedidoAbierto();
    } catch (e) {
      console.error(e);
    }
  };

  window.addEventListener("focus", onFocus);
  return () => window.removeEventListener("focus", onFocus);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [mesaId]);



  useEffect(() => {
    setPedido(null);
  setLoading(true);
  setQ("");
  setTab("PACHAMANCAS");
    (async () => {
      try {
        setLoading(true);
        await Promise.all([cargarPlatos(), cargarPedidoAbierto()]);

      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesaId]);

  // ---------- Clasificación de categorías ----------
 const clasificar = (pl) => {
  const cat = (pl.categoria || "").toUpperCase();
  const sub = (pl.subcategoria || "").toUpperCase();
  const name = (pl.nombre || "").toUpperCase();

  // HELADOS (categoria)
  if (cat.includes("HELAD")) return "HELADOS";

  // CERVEZAS (subcategoria)
  if (sub.includes("CERVEZA")) return "CERVEZAS";

  // GASEOSAS (subcategoria: GASEOSA / GASEOSAS)
  if (sub.includes("GASEOSA")) return "GASEOSAS";

  // BEBIDAS (categoria: BEBIDA / BEBIDAS)
  if (cat.includes("BEBID")) return "BEBIDAS";

  // TRUCHA
  if (cat.includes("TRUCHA") || sub.includes("TRUCHA") || name.includes("TRUCHA")) return "TRUCHA";

  // OTROS
  if (cat.includes("OTROS")) return "OTROS";

  // Default
  return "PACHAMANCAS";
};



  const platosFiltrados = useMemo(() => {
    const qq = q.trim().toLowerCase();

    return platos
      .filter((p) => (p.activo ?? true) === true)
      .filter((p) => clasificar(p) === tab)
      .filter((p) => (qq ? (p.nombre || "").toLowerCase().includes(qq) : true))
      .sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
  }, [platos, tab, q]);

  const totalPedido = useMemo(() => {
    if (!pedido?.detalles) return 0;
    return pedido.detalles.reduce((acc, d) => acc + (d.subtotal || 0), 0);
  }, [pedido]);

  const detallesOrdenados = useMemo(() => {
    if (!pedido?.detalles) return [];
    return [...pedido.detalles].sort((a, b) =>
      (a.plato?.nombre || "").localeCompare(b.plato?.nombre || "")
    );
  }, [pedido]);

const asegurarPedido = async () => {
  const mesaNum = Number(mesaId);

  // ✅ Si hay pedido pero es de OTRA mesa => lo ignoramos
  if (pedido?.id && Number(pedido.mesaId) === mesaNum) return pedido;

  const nuevo = await api.post(`/pedidos/abrir/${mesaId}`);
  setPedido(nuevo.data);
  return nuevo.data;
};



const agregar = async (platoId) => {
  try {
    setAccionando(true);

    const ped = await asegurarPedido();
    await api.post(`/pedidos/${ped.id}/agregar`, { platoId, cantidad: 1 });

    await refrescarPedido(ped.id);
    showToast("success", "✅ Agregado");
  } catch (e) {
    console.error(e);
    showToast("error", "❌ No se pudo agregar");
  } finally {
    setAccionando(false);
  }
};



const restar = async (platoId) => {
  if (!pedido?.id) return;
  try {
    setAccionando(true);
    await api.post(`/pedidos/${pedido.id}/detalles/restar`, { platoId });
    await refrescarPedido(pedido.id); // ✅ aquí
    showToast("info", "➖ Actualizado");
  } catch (e) {
    console.error(e);
    showToast("error", "❌ No se pudo restar");
  } finally {
    setAccionando(false);
  }
};


  const eliminarDetalle = async (detalleId) => {
  if (!pedido?.id) return;
  try {
    setAccionando(true);
    await api.delete(`/pedidos/detalle/${detalleId}`);
    await refrescarPedido(pedido.id); // ✅ aquí
    showToast("info", "🗑️ Eliminado");
  } catch (e) {
    console.error(e);
    showToast("error", "❌ No se pudo eliminar");
  } finally {
    setAccionando(false);
  }
};


  if (loading) {
    return <div className="min-h-screen bg-[#F7F2E8] p-6">Cargando...</div>;
  }

  
  return (
    <div className="min-h-screen bg-[#F7F2E8] text-[#2B1B12] p-6">
      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
          <div
            className={[
              "px-5 py-3 rounded-2xl shadow-xl border backdrop-blur",
              "bg-white/80 border-black/10",
              toast.type === "success" ? "text-[#2F6B4F]" : "",
              toast.type === "error" ? "text-[#7A2E2E]" : "",
              toast.type === "info" ? "text-[#6B5B52]" : "",
            ].join(" ")}
          >
            <span className="font-semibold">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="rounded-3xl bg-white/70 backdrop-blur border border-black/5 shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/mesas")}
              className="mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/5 hover:bg-black/10 text-sm font-semibold"
            >
              ← Volver a Mesas
            </button>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Mesa {pedido?.mesa?.numero || mesaId}
            </h1>
            <p className="text-[#6B5B52] mt-1">
              Menú por categorías • La Gruta – Cocharcas
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="px-5 py-3 rounded-2xl bg-[#B08D57]/10 border border-[#B08D57]/20">
              <div className="text-xs text-[#6B5B52]">Total pedido</div>
              <div className="text-xl font-extrabold">
                S/ {Number(totalPedido).toFixed(2)}
              </div>
            </div>

            <button
            disabled={!pedido?.id}
              onClick={() => navigate(`/pago/${pedido.id}`)}
                className="px-5 py-3 rounded-2xl bg-[#2F6B4F] ... disabled:opacity-60"
            >
              💳 Ir a Pago
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* IZQUIERDA: MENÚ */}
        <div className="xl:col-span-2 rounded-3xl bg-white/70 backdrop-blur border border-black/5 shadow-sm p-6">
          {/* Tabs */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="-mx-2 px-2 overflow-x-auto">
  <div className="flex gap-2 whitespace-nowrap md:flex-wrap md:whitespace-normal">
    <Tab label="🥘 Pachamancas" active={tab === "PACHAMANCAS"} onClick={() => setTab("PACHAMANCAS")} />
    <Tab label="🐟 Trucha" active={tab === "TRUCHA"} onClick={() => setTab("TRUCHA")} />

    <Tab label="🥤 Bebidas" active={tab === "BEBIDAS"} onClick={() => setTab("BEBIDAS")} />
    <Tab label="🧃 Gaseosas" active={tab === "GASEOSAS"} onClick={() => setTab("GASEOSAS")} />
    <Tab label="🍺 Cervezas" active={tab === "CERVEZAS"} onClick={() => setTab("CERVEZAS")} />
    <Tab label="🍦 Helados" active={tab === "HELADOS"} onClick={() => setTab("HELADOS")} />

    <Tab label="🍽️ Otros" active={tab === "OTROS"} onClick={() => setTab("OTROS")} />
  </div>
</div>



            <div className="w-full md:w-72">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar plato..."
                className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-white/80 outline-none focus:ring-2 focus:ring-[#B08D57]/40"
              />
            </div>
          </div>

          {/* Grid platos */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platosFiltrados.map((pl) => (
              <div
                key={pl.id}
                className="rounded-2xl bg-white/85 border border-black/5 shadow-sm p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-extrabold leading-tight">{pl.nombre}</div>
                    <div className="text-sm text-[#6B5B52] mt-1">
                      {pl.categoria} {pl.subcategoria ? `• ${pl.subcategoria}` : ""}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-[#6B5B52]">Precio</div>
                    <div className="font-extrabold">S/ {Number(pl.precio).toFixed(2)}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={() => agregar(pl.id)}
                    disabled={accionando}
                    className="w-full px-4 py-2 rounded-2xl bg-[#4B2E21] hover:bg-[#3B241A] text-white font-semibold disabled:opacity-60"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            ))}

            {!platosFiltrados.length && (
              <div className="sm:col-span-2 lg:col-span-3 text-center text-[#6B5B52] py-10">
                No hay platos en esta categoría (o no coinciden con la búsqueda).
              </div>
            )}
          </div>
        </div>

        {/* DERECHA: PEDIDO ACTUAL */}
        {(pedido?.detalles?.length ?? 0) === 0 && pedido?.id && (
  <button
    onClick={async () => {
      if (!confirm("¿Cancelar pedido vacío y liberar mesa?")) return;
      await api.delete(`/pedidos/${pedido.id}/cancelar`);
      showToast("info", "Pedido cancelado");
      navigate("/mesas");
    }}
    className="mt-4 w-full px-5 py-3 rounded-2xl bg-[#7A2E2E] hover:bg-[#5F2323] text-white font-semibold"
  >
    ❌ Cancelar pedido (vacío)
  </button>
)}

        <div className="rounded-3xl bg-white/70 backdrop-blur border border-black/5 shadow-sm p-6">
          <h2 className="text-xl font-extrabold">🧾 Pedido actual</h2>
          <p className="text-sm text-[#6B5B52] mt-1">
            Aquí controlas cantidades y eliminaciones.
          </p>
{(pedido?.detalles?.length ?? 0) === 0 && pedido?.id && (
  <button
    onClick={async () => {
      if (!confirm("¿Cancelar pedido vacío y liberar mesa?")) return;
      try {
        await api.delete(`/pedidos/${pedido.id}/cancelar`);
        showToast("info", "Pedido cancelado");
        navigate("/mesas");
      } catch (e) {
        console.error(e);
        showToast("error", "No se pudo cancelar");
      }
    }}
    className="mt-4 w-full px-5 py-3 rounded-2xl bg-[#7A2E2E] hover:bg-[#5F2323] text-white font-semibold"
  >
    ❌ Cancelar pedido (vacío)
  </button>
)}

          <div className="mt-5 space-y-3">
            {detallesOrdenados.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl bg-white/85 border border-black/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold">{d.plato?.nombre}</div>
                    <div className="text-sm text-[#6B5B52]">
                      S/ {Number(d.precio).toFixed(2)} c/u
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-[#6B5B52]">Subtotal</div>
                    <div className="font-extrabold">
                      S/ {Number(d.subtotal).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => restar(d.platoId)}
                      disabled={accionando}
                      className="w-10 h-10 rounded-2xl bg-black/5 hover:bg-black/10 font-extrabold disabled:opacity-60"
                    >
                      −
                    </button>
                    <div className="min-w-[52px] text-center font-extrabold">
                      {d.cantidad}
                    </div>
                    <button
                      onClick={() => agregar(d.platoId)}
                      disabled={accionando}
                      className="w-10 h-10 rounded-2xl bg-black/5 hover:bg-black/10 font-extrabold disabled:opacity-60"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => eliminarDetalle(d.id)}
                    disabled={accionando}
                    className="px-4 py-2 rounded-2xl bg-[#7A2E2E] hover:bg-[#5F2323] text-white font-semibold disabled:opacity-60"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {!detallesOrdenados.length && (
              <div className="text-center text-[#6B5B52] py-10">
                Aún no agregaste platos.
              </div>
            )}
          </div>

          <div className="mt-6 h-px bg-black/5" />

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-[#6B5B52]">Total</div>
            <div className="text-2xl font-extrabold">
              S/ {Number(totalPedido).toFixed(2)}
            </div>
          </div>

          <button
            onClick={() => navigate(`/pago/${pedido.id}`)}
            className="mt-5 w-full px-5 py-3 rounded-2xl bg-[#2F6B4F] hover:bg-[#25583F] text-white font-semibold shadow"
          >
            💳 Cobrar / Pagar
          </button>
        </div>
      </div>
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-2xl font-semibold border transition",
        active
          ? "bg-[#B08D57]/15 border-[#B08D57]/30 text-[#2B1B12]"
          : "bg-white/70 border-black/10 text-[#6B5B52] hover:bg-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
