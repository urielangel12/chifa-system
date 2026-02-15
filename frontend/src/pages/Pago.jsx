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

  // construir items de pago parcial desde el pedido
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

  const totalPedido = useMemo(() => {
    return Number(pedido?.total || 0);
  }, [pedido]);

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

      await api.post(`/pedidos/${pedidoId}/cerrar`, {
        metodoPago,
      });

      abrirModal(
        "success",
        "Pago total registrado. Liberando mesa y regresando a Mesas…"
      );

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
      .map((i) => ({
        detalleId: i.detalleId,
        cantidad: i.pagar,
      }));

    if (!itemsSeleccionados.length) return abrirModal("warning");

    try {
      setLoadingParcial(true);

      const { data } = await api.post(`/pedidos/${pedidoId}/pago-items`, {
        items: itemsSeleccionados,
        metodoPago,
      });

      if (data.cerrado) {
        abrirModal(
          "success",
          "Pago parcial aplicado y el pedido quedó COMPLETO. Liberando mesa…"
        );
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
    return <div className="min-h-screen bg-[#F7F2E8] p-6">Cargando…</div>;
  }

  const yaPagado = pedido.estado === "PAGADO";

  return (
    <div className="min-h-screen bg-[#F7F2E8] text-[#2B1B12] p-6">
      {/* MODAL OVERLAY */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center w-full max-w-sm border border-black/10 animate-popIn">
            {modal === "success" && (
              <>
                <h2 className="text-xl font-extrabold text-[#2F6B4F] mb-2">
                  ✅ Operación exitosa
                </h2>
                <p className="text-[#6B5B52]">{mensajeSuccess || "Listo ✅"}</p>
              </>
            )}

            {modal === "error" && (
              <>
                <h2 className="text-xl font-extrabold text-[#7A2E2E] mb-2">
                  ❌ Error al procesar pago
                </h2>
                <p className="text-[#6B5B52]">
                  Verifica conexión o datos e intenta otra vez.
                </p>
                <button
                  onClick={cerrarModal}
                  className="mt-5 w-full bg-[#7A2E2E] hover:bg-[#5F2323] text-white py-3 rounded-2xl font-semibold"
                >
                  Cerrar
                </button>
              </>
            )}

            {modal === "warning" && (
              <>
                <h2 className="text-xl font-extrabold text-[#B08D57] mb-2">
                  ⚠️ Falta selección
                </h2>
                <p className="text-[#6B5B52]">
                  Selecciona método de pago y/o productos a pagar.
                </p>
                <button
                  onClick={cerrarModal}
                  className="mt-5 w-full bg-[#B08D57] hover:bg-[#9A7B4D] text-white py-3 rounded-2xl font-semibold"
                >
                  Entendido
                </button>
              </>
            )}
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
              💳 Pago — Mesa {pedido?.mesa?.numero}
            </h1>
            <p className="text-[#6B5B52] mt-1">
              La Gruta • Cocharcas — Pago total o parcial por productos
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <div className="px-4 py-2 rounded-2xl bg-[#B08D57]/10 border border-[#B08D57]/20">
              <div className="text-xs text-[#6B5B52]">Total pedido</div>
              <div className="font-extrabold text-lg">
                S/ {totalPedido.toFixed(2)}
              </div>
            </div>

            <div
              className={[
                "px-4 py-2 rounded-2xl border",
                yaPagado
                  ? "bg-[#2F6B4F]/10 border-[#2F6B4F]/20 text-[#2F6B4F]"
                  : "bg-[#7A2E2E]/10 border-[#7A2E2E]/20 text-[#7A2E2E]",
              ].join(" ")}
            >
              <div className="text-xs opacity-80">Estado</div>
              <div className="font-extrabold text-lg">
                {yaPagado ? "PAGADO" : "ABIERTO"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {yaPagado && (
        <div className="mt-6 rounded-3xl bg-white/70 border border-black/5 shadow-sm p-6">
          <h2 className="text-xl font-extrabold text-[#2F6B4F]">
            ✅ Este pedido ya está pagado
          </h2>
          <p className="text-[#6B5B52] mt-1">
            Puedes volver a Mesas para atender otra mesa.
          </p>
          <button
            onClick={() => navigate("/mesas")}
            className="mt-4 px-5 py-3 rounded-2xl bg-[#2F6B4F] hover:bg-[#25583F] text-white font-semibold shadow"
          >
            Volver a Mesas
          </button>
        </div>
      )}

      {/* CONTENIDO */}
      {!yaPagado && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RESUMEN PEDIDO */}
          <div className="rounded-3xl bg-white/70 backdrop-blur border border-black/5 shadow-sm p-6">
            <h2 className="text-xl font-extrabold">🧾 Resumen del pedido</h2>
            <p className="text-sm text-[#6B5B52] mt-1">
              Detalle de productos y subtotales.
            </p>

            <div className="mt-4 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-left">
                    <th className="py-2">Cant</th>
                    <th className="py-2">Producto</th>
                    <th className="py-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.detalles?.map((d) => (
                    <tr key={d.id} className="border-b border-black/5">
                      <td className="py-2">{d.cantidad}</td>
                      <td className="py-2">{d.plato?.nombre}</td>
                      <td className="py-2 text-right">
                        S/ {Number(d.subtotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="text-sm text-[#6B5B52]">Total</div>
              <div className="text-2xl font-extrabold">
                S/ {totalPedido.toFixed(2)}
              </div>
            </div>
          </div>

          {/* MÉTODO DE PAGO + ACCIONES */}
          <div className="rounded-3xl bg-white/70 backdrop-blur border border-black/5 shadow-sm p-6">
            <h2 className="text-xl font-extrabold">💰 Método de pago</h2>
            <p className="text-sm text-[#6B5B52] mt-1">
              Elige EFECTIVO o YAPE para registrar el pago.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setMetodoPago("EFECTIVO")}
                className={[
                  "px-4 py-3 rounded-2xl border font-semibold text-left",
                  metodoPago === "EFECTIVO"
                    ? "bg-[#2F6B4F]/10 border-[#2F6B4F]/25"
                    : "bg-white/70 border-black/10 hover:bg-white",
                ].join(" ")}
              >
                💵 EFECTIVO
              </button>

              <button
                onClick={() => setMetodoPago("YAPE")}
                className={[
                  "px-4 py-3 rounded-2xl border font-semibold text-left",
                  metodoPago === "YAPE"
                    ? "bg-[#B08D57]/10 border-[#B08D57]/25"
                    : "bg-white/70 border-black/10 hover:bg-white",
                ].join(" ")}
              >
                📱 YAPE
              </button>
            </div>

            {metodoPago === "YAPE" && (
              <div className="mt-5 rounded-2xl bg-white/80 border border-black/10 p-4 text-center">
                <p className="font-semibold mb-2">Escanee el QR</p>
                <img
                  src="/yape-qr.png"
                  alt="QR Yape"
                  className="mx-auto w-48"
                />
              </div>
            )}

            {/* PAGO TOTAL */}
            <button
              onClick={pagarTotal}
              disabled={loadingTotal || loadingParcial}
              className="mt-6 w-full px-5 py-3 rounded-2xl bg-[#2F6B4F] hover:bg-[#25583F] text-white font-semibold shadow disabled:opacity-60"
            >
              {loadingTotal ? "Procesando pago total..." : "✅ Confirmar Pago Total"}
            </button>

            <div className="mt-6 h-px bg-black/5" />

            {/* PAGO PARCIAL */}
            <h3 className="mt-6 font-extrabold">Pago parcial por productos</h3>
            <p className="text-sm text-[#6B5B52] mt-1">
              Elige cantidades a pagar por cada producto (ideal para dividir cuentas).
            </p>

            <div className="mt-4 space-y-3">
              {itemsPago.map((item) => {
                const sub = item.pagar * item.precio;

                return (
                  <div
                    key={item.detalleId}
                    className="rounded-2xl bg-white/85 border border-black/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold">{item.nombre}</div>
                        <div className="text-sm text-[#6B5B52]">
                          Precio: S/ {item.precio.toFixed(2)} • Pendiente:{" "}
                          <span className="font-semibold">{item.pendiente}</span>
                        </div>
                      </div>

                      <input
                        type="number"
                        min="0"
                        max={item.pendiente}
                        value={item.pagar}
                        onChange={(e) =>
                          handleCantidadChange(item.detalleId, e.target.value)
                        }
                        className="w-20 px-3 py-2 rounded-xl border border-black/10 bg-white outline-none focus:ring-2 focus:ring-[#B08D57]/40"
                      />
                    </div>

                    <div className="mt-3 text-right text-sm text-[#6B5B52]">
                      Subtotal parcial:{" "}
                      <span className="font-extrabold text-[#2B1B12]">
                        S/ {sub.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-[#6B5B52]">Total parcial</div>
              <div className="text-xl font-extrabold">
                S/ {totalParcial.toFixed(2)}
              </div>
            </div>

            <button
              onClick={confirmarPagoParcial}
              disabled={loadingParcial || loadingTotal}
              className="mt-4 w-full px-5 py-3 rounded-2xl bg-[#B08D57] hover:bg-[#9A7B4D] text-white font-semibold shadow disabled:opacity-60"
            >
              {loadingParcial ? "Procesando pago parcial..." : "🧾 Confirmar Pago Parcial"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
