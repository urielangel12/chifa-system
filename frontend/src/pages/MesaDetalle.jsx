import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

export default function MesaDetalle() {
  const { id } = useParams();
  const mesaId = id;
  const navigate = useNavigate();

  if (!mesaId) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6">
        Error: mesaId inválido. Revisa la ruta /mesas/:id
      </div>
    );
  }

  const [pedido, setPedido] = useState(null);
  const [platos, setPlatos] = useState([]);
  const [tab, setTab] = useState("CHIFA");
  const [q, setQ] = useState("");

  const [loading, setLoading] = useState(true);
  const [accionando, setAccionando] = useState(false);

  const [toast, setToast] = useState(null);

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
      setPedido(res.data);
    } catch (err) {
      if (err.response?.status === 404) setPedido(null);
      else {
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
    setTab("CHIFA");

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
    const name = (pl.nombre || "").toUpperCase();

    if (cat.includes("CHIFA")) return "CHIFA";
    if (cat.includes("SALCHIS")) return "SALCHIS";
    if (cat.includes("POLLO")) return "POLLO";
    if (cat.includes("BROASTER")) return "BROASTER";
    if (cat.includes("MARISC")) return "MARISCOS";
    if (cat.includes("HAMBURG")) return "HAMBURGUESAS";
    if (cat.includes("MAKIS")) return "MAKIS";
    if (cat.includes("BEBID")) return "BEBIDAS";
    if (cat.includes("SOPAS")) return "SOPAS";

    if (name.includes("CHAUFA") || name.includes("AEROPUERTO")) return "CHIFA";
    if (name.includes("MAKI")) return "MAKIS";
    if (name.includes("JUGO") || name.includes("CAF") || name.includes("TE")) return "BEBIDAS";

    return "CHIFA";
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
      await refrescarPedido(pedido.id);
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
      await refrescarPedido(pedido.id);
      showToast("info", "🗑️ Eliminado");
    } catch (e) {
      console.error(e);
      showToast("error", "❌ No se pudo eliminar");
    } finally {
      setAccionando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 sm:p-6">
      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
          <div
            className={[
              "px-5 py-3 rounded-2xl shadow-xl border backdrop-blur",
              "bg-[var(--card)] border-[var(--accent)]/25",
              toast.type === "success" ? "text-[var(--success)]" : "",
              toast.type === "error" ? "text-[var(--danger)]" : "",
              toast.type === "info" ? "text-[var(--accent)]" : "",
            ].join(" ")}
          >
            <span className="font-semibold">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="card-theme rounded-3xl shadow-xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/mesas")}
              className="mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold"
            >
              ← Volver a Mesas
            </button>

            <div className="chip-accent inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-extrabold">
              🍜 Menú Chifa
            </div>

            <h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--textDark)]">
              Mesa {pedido?.mesa?.numero || mesaId}
            </h1>

            <p className="text-[var(--muted)] mt-1">
              Selecciona platos • controla cantidades • cobra al toque
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="px-5 py-3 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/35">
              <div className="text-xs text-[var(--muted)]">Total pedido</div>
              <div className="text-xl font-extrabold text-[var(--textDark)]">
                S/ {Number(totalPedido).toFixed(2)}
              </div>
            </div>

            <button
              disabled={!pedido?.id}
              onClick={() => navigate(`/pago/${pedido.id}`)}
              className="px-5 py-3 rounded-2xl font-extrabold shadow border border-[var(--accent)]/40
                         bg-[var(--accent)] hover:bg-[var(--accentHover)] text-black
                         disabled:opacity-60"
            >
              💳 Ir a Pago
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* IZQUIERDA: MENÚ */}
        <div className="xl:col-span-2 card-theme rounded-3xl shadow-xl p-5 sm:p-6">
          {/* Tabs + buscador */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="-mx-2 px-2 overflow-x-auto">
              <div className="flex gap-2 whitespace-nowrap md:flex-wrap md:whitespace-normal">
                <Tab label="🍚 Chifa" active={tab === "CHIFA"} onClick={() => setTab("CHIFA")} />
                <Tab label="🍟 Salchis" active={tab === "SALCHIS"} onClick={() => setTab("SALCHIS")} />
                <Tab label="🍗 Pollo" active={tab === "POLLO"} onClick={() => setTab("POLLO")} />
                <Tab label="🍗 Broaster" active={tab === "BROASTER"} onClick={() => setTab("BROASTER")} />
                <Tab label="🦐 Mariscos" active={tab === "MARISCOS"} onClick={() => setTab("MARISCOS")} />
                <Tab label="🍔 Hamburguesas" active={tab === "HAMBURGUESAS"} onClick={() => setTab("HAMBURGUESAS")} />
                <Tab label="🍣 Makis" active={tab === "MAKIS"} onClick={() => setTab("MAKIS")} />
                <Tab label="🥤 Bebidas" active={tab === "BEBIDAS"} onClick={() => setTab("BEBIDAS")} />
                <Tab label="🥣 Sopas" active={tab === "SOPAS"} onClick={() => setTab("SOPAS")} />
              </div>
            </div>

            <div className="w-full md:w-80">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar plato..."
                className="w-full px-4 py-3 rounded-2xl border border-white/15 bg-white/10
                           text-[var(--textDark)] placeholder:text-[var(--muted)]
                           outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              />
            </div>
          </div>

          {/* Grid platos */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platosFiltrados.map((pl) => (
              <div
                key={pl.id}
                className="rounded-2xl bg-white/10 border border-white/10 shadow-sm p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-extrabold leading-tight text-[var(--textDark)]">
                      {pl.nombre}
                    </div>
                    <div className="text-sm text-[var(--muted)] mt-1">
                      {pl.categoria} {pl.subcategoria ? `• ${pl.subcategoria}` : ""}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-[var(--muted)]">Precio</div>
                    <div className="font-extrabold text-[var(--textDark)]">
                      S/ {Number(pl.precio).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => agregar(pl.id)}
                    disabled={accionando}
                    className="w-full px-4 py-2 rounded-2xl btn-primary border border-white/15 font-extrabold disabled:opacity-60"
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            ))}

            {!platosFiltrados.length && (
              <div className="sm:col-span-2 lg:col-span-3 text-center text-[var(--muted)] py-10">
                No hay platos en esta categoría (o no coinciden con la búsqueda).
              </div>
            )}
          </div>
        </div>

        {/* DERECHA: PEDIDO ACTUAL */}
        <div className="card-theme rounded-3xl shadow-xl p-5 sm:p-6">
          <h2 className="text-xl font-extrabold text-[var(--textDark)]">🧾 Pedido actual</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
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
              className="mt-4 w-full px-5 py-3 rounded-2xl font-extrabold shadow
                         bg-[var(--danger)] hover:bg-[var(--dangerHover)] text-white"
            >
              ❌ Cancelar pedido (vacío)
            </button>
          )}

          <div className="mt-5 space-y-3">
            {detallesOrdenados.map((d) => (
              <div
                key={d.id}
                className="rounded-2xl bg-white/10 border border-white/10 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-extrabold text-[var(--textDark)]">
                      {d.plato?.nombre}
                    </div>
                    <div className="text-sm text-[var(--muted)]">
                      S/ {Number(d.precio).toFixed(2)} c/u
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-[var(--muted)]">Subtotal</div>
                    <div className="font-extrabold text-[var(--textDark)]">
                      S/ {Number(d.subtotal).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => restar(d.platoId)}
                      disabled={accionando}
                      className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 font-extrabold disabled:opacity-60"
                    >
                      −
                    </button>

                    <div className="min-w-[52px] text-center font-extrabold text-[var(--textDark)]">
                      {d.cantidad}
                    </div>

                    <button
                      onClick={() => agregar(d.platoId)}
                      disabled={accionando}
                      className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 font-extrabold disabled:opacity-60"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => eliminarDetalle(d.id)}
                    disabled={accionando}
                    className="px-4 py-2 rounded-2xl font-extrabold shadow
                               bg-[var(--danger)] hover:bg-[var(--dangerHover)] text-white disabled:opacity-60"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {!detallesOrdenados.length && (
              <div className="text-center text-[var(--muted)] py-10">
                Aún no agregaste platos.
              </div>
            )}
          </div>

          <div className="mt-6 h-px bg-white/10" />

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-[var(--muted)]">Total</div>
            <div className="text-2xl font-extrabold text-[var(--textDark)]">
              S/ {Number(totalPedido).toFixed(2)}
            </div>
          </div>

          <button
            disabled={!pedido?.id}
            onClick={() => navigate(`/pago/${pedido.id}`)}
            className="mt-5 w-full px-5 py-3 rounded-2xl font-extrabold shadow border border-[var(--accent)]/40
                       bg-[var(--accent)] hover:bg-[var(--accentHover)] text-black
                       disabled:opacity-60"
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
        "px-4 py-2 rounded-2xl font-extrabold border transition",
        active
          ? "bg-[var(--primary)] hover:bg-[var(--primaryHover)] text-white border-white/15"
          : "bg-[var(--accent)]/15 hover:bg-[var(--accent)]/25 text-[var(--textDark)] border-[var(--accent)]/35",
      ].join(" ")}
    >
      {label}
    </button>
  );
}