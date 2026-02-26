import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Pago() {
  const { pedidoId } = useParams();
  const navigate = useNavigate();

  const [itemsPago, setItemsPago] = useState([]);
  const [pedido, setPedido] = useState(null);
  const [metodoPago, setMetodoPago] = useState("");
  const [loadingTotal, setLoadingTotal] = useState(false);
  const [loadingParcial, setLoadingParcial] = useState(false);

  const [modal, setModal] = useState(null); // "success" | "error" | "warning"
  const [mensajeSuccess, setMensajeSuccess] = useState("");

  const cargarPedido = async () => {
    const res = await api.get(`/pedidos/${pedidoId}`);
    setPedido(res.data);
  };

  useEffect(() => {
    cargarPedido().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoId]);

  useEffect(() => {
    if (!pedido?.detalles) return;

    const pendientes = pedido.detalles.map((det) => ({
      detalleId: det.id,
      nombre: det.plato?.nombre || "Producto",
      precio: Number(det.precio || 0),
      pendiente: Number(det.cantidad || 0) - Number(det.cantidadPagada || 0),
      pagar: 0,
    }));

    setItemsPago(pendientes);
  }, [pedido]);

  const totalPedido = useMemo(() => Number(pedido?.total || 0), [pedido]);

  const totalParcial = useMemo(() => {
    return itemsPago.reduce((acc, item) => acc + item.pagar * item.precio, 0);
  }, [itemsPago]);

  const handleCantidadChange = (detalleId, value) => {
    setItemsPago((prev) =>
      prev.map((item) =>
        item.detalleId === detalleId
          ? {
              ...item,
              pagar: Math.min(Math.max(0, Number(value)), item.pendiente),
            }
          : item
      )
    );
  };

  const abrirModal = (tipo, msg = "") => {
    setModal(tipo);
    if (tipo === "success") setMensajeSuccess(msg);
  };

  const cerrarModal = () => setModal(null);

  const pagarTotal = async () => {
    if (!metodoPago) return abrirModal("warning");

    try {
      setLoadingTotal(true);

      await api.post(`/pedidos/${pedidoId}/cerrar`, { metodoPago });

      abrirModal("success", "Pago total registrado. Liberando mesa y regresando a Mesas…");
      setTimeout(() => navigate("/mesas"), 2000);
    } catch (error) {
      console.error(error);
      abrirModal("error");
    } finally {
      setLoadingTotal(false);
    }
  };

  const confirmarPagoParcial = async () => {
    if (!metodoPago) return abrirModal("warning");

    const itemsSeleccionados = itemsPago
      .filter((i) => i.pagar > 0)
      .map((i) => ({ detalleId: i.detalleId, cantidad: i.pagar }));

    if (!itemsSeleccionados.length) return abrirModal("warning");

    try {
      setLoadingParcial(true);

      const { data } = await api.post(`/pedidos/${pedidoId}/pago-items`, {
        items: itemsSeleccionados,
        metodoPago,
      });

      if (data.cerrado) {
        abrirModal("success", "Pago parcial aplicado y el pedido quedó COMPLETO. Liberando mesa…");
        setTimeout(() => navigate("/mesas"), 2000);
      } else {
        abrirModal("success", "Pago parcial aplicado correctamente ✅");
        await cargarPedido();
        setTimeout(() => setModal(null), 1600);
      }
    } catch (error) {
      console.error(error);
      abrirModal("error");
    } finally {
      setLoadingParcial(false);
    }
  };

  if (!pedido) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6">
        Cargando…
      </div>
    );
  }

  const yaPagado = pedido.estado === "PAGADO";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-4 sm:p-6">
      {/* MODAL OVERLAY */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="card-theme rounded-3xl shadow-2xl p-7 text-center w-full max-w-sm border border-white/10 animate-popIn">
            {modal === "success" && (
              <>
                <h2 className="text-xl font-extrabold text-[var(--success)] mb-2">
                  ✅ Operación exitosa
                </h2>
                <p className="text-[var(--muted)]">{mensajeSuccess || "Listo ✅"}</p>
              </>
            )}

            {modal === "error" && (
              <>
                <h2 className="text-xl font-extrabold text-[var(--danger)] mb-2">
                  ❌ Error al procesar pago
                </h2>
                <p className="text-[var(--muted)]">
                  Verifica conexión o datos e intenta otra vez.
                </p>
                <button
                  onClick={cerrarModal}
                  className="mt-5 w-full px-5 py-3 rounded-2xl font-extrabold shadow
                             bg-[var(--danger)] hover:bg-[var(--dangerHover)] text-white"
                >
                  Cerrar
                </button>
              </>
            )}

            {modal === "warning" && (
              <>
                <h2 className="text-xl font-extrabold text-[var(--accent)] mb-2">
                  ⚠️ Falta selección
                </h2>
                <p className="text-[var(--muted)]">
                  Selecciona método de pago y/o productos a pagar.
                </p>
                <button
                  onClick={cerrarModal}
                  className="mt-5 w-full px-5 py-3 rounded-2xl font-extrabold shadow border border-[var(--accent)]/35
                             bg-[var(--accent)] hover:bg-[var(--accentHover)] text-black"
                >
                  Entendido
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="card-theme rounded-3xl shadow-xl p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate("/mesas")}
              className="mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-2xl
                         bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold"
            >
              ← Volver a Mesas
            </button>

            <div className="chip-accent inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-extrabold">
              💳 Caja / Cobro
            </div>

            <h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--textDark)]">
              Pago — Mesa {pedido?.mesa?.numero}
            </h1>
            <p className="text-[var(--muted)] mt-1">
              Pago total o parcial por productos (ideal para dividir cuentas).
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="px-4 py-2 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/35">
              <div className="text-xs text-[var(--muted)]">Total pedido</div>
              <div className="font-extrabold text-lg text-[var(--textDark)]">
                S/ {totalPedido.toFixed(2)}
              </div>
            </div>

            <div
              className={[
                "px-4 py-2 rounded-2xl border",
                yaPagado
                  ? "bg-[var(--success)]/15 border-[var(--success)]/35 text-[var(--success)]"
                  : "bg-[var(--danger)]/15 border-[var(--danger)]/35 text-[var(--danger)]",
              ].join(" ")}
            >
              <div className="text-xs opacity-80">Estado</div>
              <div className="font-extrabold text-lg">{yaPagado ? "PAGADO" : "ABIERTO"}</div>
            </div>
          </div>
        </div>
      </div>

      {yaPagado && (
        <div className="mt-6 card-theme rounded-3xl shadow-xl p-6">
          <h2 className="text-xl font-extrabold text-[var(--success)]">
            ✅ Este pedido ya está pagado
          </h2>
          <p className="text-[var(--muted)] mt-1">
            Puedes volver a Mesas para atender otra mesa.
          </p>
          <button
            onClick={() => navigate("/mesas")}
            className="mt-4 px-5 py-3 rounded-2xl font-extrabold shadow btn-primary border border-white/15"
          >
            Volver a Mesas
          </button>
        </div>
      )}

      {/* CONTENIDO */}
      {!yaPagado && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RESUMEN PEDIDO */}
          <div className="card-theme rounded-3xl shadow-xl p-5 sm:p-6">
            <h2 className="text-xl font-extrabold text-[var(--textDark)]">🧾 Resumen del pedido</h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Detalle de productos y subtotales.
            </p>

            <div className="mt-4 overflow-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left bg-white/5">
                    <th className="py-3 px-3">Cant</th>
                    <th className="py-3 px-3">Producto</th>
                    <th className="py-3 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.detalles?.map((d) => (
                    <tr key={d.id} className="border-b border-white/10">
                      <td className="py-3 px-3 text-[var(--textDark)] font-extrabold">
                        {d.cantidad}
                      </td>
                      <td className="py-3 px-3 text-[var(--textDark)]">
                        {d.plato?.nombre}
                      </td>
                      <td className="py-3 px-3 text-right text-[var(--textDark)] font-extrabold">
                        S/ {Number(d.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-sm text-[var(--muted)]">Total</div>
              <div className="text-2xl font-extrabold text-[var(--textDark)]">
                S/ {totalPedido.toFixed(2)}
              </div>
            </div>
          </div>

          {/* MÉTODO DE PAGO + ACCIONES */}
          <div className="card-theme rounded-3xl shadow-xl p-5 sm:p-6">
            <h2 className="text-xl font-extrabold text-[var(--textDark)]">💰 Método de pago</h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Elige EFECTIVO o YAPE para registrar el pago.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setMetodoPago("EFECTIVO")}
                className={[
                  "px-4 py-3 rounded-2xl border font-extrabold text-left transition",
                  metodoPago === "EFECTIVO"
                    ? "bg-[var(--accent)]/20 border-[var(--accent)]/45 text-[var(--textDark)]"
                    : "bg-white/10 border-white/10 hover:bg-white/15 text-[var(--textDark)]",
                ].join(" ")}
              >
                💵 EFECTIVO
              </button>

              <button
                onClick={() => setMetodoPago("YAPE")}
                className={[
                  "px-4 py-3 rounded-2xl border font-extrabold text-left transition",
                  metodoPago === "YAPE"
                    ? "bg-[var(--accent)]/20 border-[var(--accent)]/45 text-[var(--textDark)]"
                    : "bg-white/10 border-white/10 hover:bg-white/15 text-[var(--textDark)]",
                ].join(" ")}
              >
                📱 YAPE
              </button>
            </div>

            {metodoPago === "YAPE" && (
              <div className="mt-5 rounded-2xl bg-white/10 border border-white/10 p-4 text-center">
                <p className="font-extrabold text-[var(--textDark)] mb-2">Escanee el QR</p>
                <img src="/yape-qr.png" alt="QR Yape" className="mx-auto w-48" />
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Si no carga el QR, revisa la imagen /public/yape-qr.png
                </p>
              </div>
            )}

            {/* PAGO TOTAL (dorado) */}
            <button
              onClick={pagarTotal}
              disabled={loadingTotal || loadingParcial}
              className="mt-6 w-full px-5 py-3 rounded-2xl font-extrabold shadow border border-[var(--accent)]/40
                         bg-[var(--accent)] hover:bg-[var(--accentHover)] text-black disabled:opacity-60"
            >
              {loadingTotal ? "Procesando pago total..." : "✅ Confirmar Pago Total"}
            </button>

            <div className="mt-6 h-px bg-white/10" />

            {/* PAGO PARCIAL (rojo chifa) */}
            <h3 className="mt-6 font-extrabold text-[var(--textDark)]">Pago parcial por productos</h3>
            <p className="text-sm text-[var(--muted)] mt-1">
              Elige cantidades a pagar por cada producto.
            </p>

            <div className="mt-4 space-y-3">
              {itemsPago.map((item) => {
                const sub = item.pagar * item.precio;
                const disabled = item.pendiente <= 0;

                return (
                  <div
                    key={item.detalleId}
                    className={[
                      "rounded-2xl border p-4",
                      disabled ? "bg-white/5 border-white/10 opacity-60" : "bg-white/10 border-white/10",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-[var(--textDark)]">{item.nombre}</div>
                        <div className="text-sm text-[var(--muted)]">
                          Precio: S/ {item.precio.toFixed(2)} • Pendiente:{" "}
                          <span className="font-extrabold text-[var(--textDark)]">{item.pendiente}</span>
                        </div>
                      </div>

                      <input
                        type="number"
                        min="0"
                        max={item.pendiente}
                        value={item.pagar}
                        disabled={disabled}
                        onChange={(e) => handleCantidadChange(item.detalleId, e.target.value)}
                        className="w-20 px-3 py-2 rounded-xl border border-white/10 bg-white/10
                                   text-[var(--textDark)] outline-none
                                   focus:ring-2 focus:ring-[var(--accent)]/40 disabled:opacity-50"
                      />
                    </div>

                    <div className="mt-3 text-right text-sm text-[var(--muted)]">
                      Subtotal parcial:{" "}
                      <span className="font-extrabold text-[var(--textDark)]">
                        S/ {sub.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-[var(--muted)]">Total parcial</div>
              <div className="text-xl font-extrabold text-[var(--textDark)]">
                S/ {totalParcial.toFixed(2)}
              </div>
            </div>

            <button
              onClick={confirmarPagoParcial}
              disabled={loadingParcial || loadingTotal}
              className="mt-4 w-full px-5 py-3 rounded-2xl font-extrabold shadow btn-primary border border-white/15 disabled:opacity-60"
            >
              {loadingParcial ? "Procesando pago parcial..." : "🧾 Confirmar Pago Parcial"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}