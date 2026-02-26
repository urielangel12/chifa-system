import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Mesas() {
  const [mesas, setMesas] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [cerrando, setCerrando] = useState(false);

  const [modal, setModal] = useState(null); // "success" | "error"
  const [modalMsg, setModalMsg] = useState("");
  const [obs, setObs] = useState("");

  const navigate = useNavigate();

  const cargarMesas = async () => {
    const res = await api.get("/mesas");
    setMesas(res.data || []);
  };

 useEffect(() => {
  let timer = null;
  let delay = 8000; // ✅ 8s

  const tick = async () => {
    // si está en segundo plano, no consultes
    if (document.hidden) {
      timer = setTimeout(tick, delay);
      return;
    }

    try {
      await cargarMesas();
      delay = 8000; // si fue bien, vuelve a 8s
    } catch (e) {
      // si falla, backoff para no spamear
      delay = Math.min(delay * 2, 60000); // max 60s
    }

    timer = setTimeout(tick, delay);
  };

  tick();

  const onFocus = () => cargarMesas();
  const onVis = () => {
    if (!document.hidden) cargarMesas();
  };

  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVis);

  return () => {
    if (timer) clearTimeout(timer);
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVis);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

 
  const resumen = useMemo(() => {
    const total = mesas.length;
    const ocupadas = mesas.filter((m) => m.estado === "OCUPADA").length;
    const libres = total - ocupadas;
    return { total, ocupadas, libres };
  }, [mesas]);

  const cerrarJornada = async () => {
    try {
      setCerrando(true);

      const res = await api.post("/jornada/cerrar", { observaciones: obs });
      setObs("");

      setModal("success");
      setModalMsg(res.data?.mensaje || "Jornada cerrada correctamente");

      setTimeout(() => {
        setModal(null);
        navigate("/");
      }, 2000);
    } catch (error) {
      setModal("error");
      setModalMsg(
        error.response?.data?.mensaje ||
          error.response?.data?.error ||
          "No se pudo cerrar la jornada"
      );
      setTimeout(() => setModal(null), 2500);
    } finally {
      setCerrando(false);
      setMostrarModal(false);
    }
  };

  const MesaCard = ({ mesa }) => {
    const ocupada = mesa.estado === "OCUPADA";

    return (
      <button
        type="button"
        onClick={() => navigate(`/mesas/${mesa.id}`)}
      className={[
  "group relative text-left rounded-3xl p-4 sm:p-5",
  "transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl",
  "border",
  ocupada
    ? [
        // 🔥 OCUPADA: naranja chifa (fuerte pero legible)
        "bg-gradient-to-br from-orange-500/35 via-amber-400/25 to-black/15",
        "border-orange-400/60",
        "text-[var(--textDark)]",
      ].join(" ")
    : [
        // ✅ LIBRE: card normal dark elegante
        "card-theme",
        "border-[var(--accent)]/30",
      ].join(" "),
].join(" ")}
      >
        {/* Badge estado */}
        <div className="absolute top-4 right-4">
          <span
            className={[
              "px-3 py-1 rounded-full text-xs font-extrabold tracking-wide",
              ocupada
  ? "bg-orange-500/25 border border-orange-400/60 text-[var(--textDark)]"
  : "bg-[var(--accent)]/18 border border-[var(--accent)]/40 text-[var(--textDark)]"
            ].join(" ")}
          >
            {ocupada ? "OCUPADA" : "LIBRE"}
          </span>
        </div>

        {/* Icono */}
        <div
          className={[
            "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
            ocupada
              ? "bg-[var(--primary)]/20 border border-[var(--primary)]/30"
              : "bg-[var(--accent)]/18 border border-[var(--accent)]/30",
          ].join(" ")}
        >
          <span className="text-2xl">{ocupada ? "🍲" : "🪑"}</span>
        </div>

        {/* Texto */}
        <div className="text-[var(--textDark)]">
          <div className={ocupada ? "text-sm text-black/70" : "text-sm text-[var(--muted)]"}>
  Mesa
</div>
          <div className="text-2xl font-extrabold tracking-tight">
            {mesa.numero}
          </div>
        </div>

      <div className={ocupada ? "mt-3 text-sm text-black/70" : "mt-3 text-sm text-[var(--muted)]"}>
  {ocupada ? "En atención" : "Disponible"}
</div>

        <div className="mt-4 h-px bg-white/10" />

        <div className="mt-3 text-xs text-[var(--muted)] flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent)]" />
          VELAMI • SNAILIS
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Top bar */}
      <div className="px-4 sm:px-6 pt-6">
        <div className="card-theme rounded-3xl shadow-2xl p-6 border border-[var(--accent)]/20">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="chip-accent inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-extrabold">
                🪑 Panel de Mesas
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-3">
                VELAMI – SNAILIS
              </h1>
              <p className="text-[var(--muted)] mt-1">
                Selecciona una mesa para tomar pedidos y cobrar.
              </p>
            </div>

            {/* resumen + acciones */}
            <div className="flex flex-col gap-3">
              {/* resumen */}
              <div className="flex flex-wrap gap-2">
                <div className="px-4 py-2 rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent)]/12">
                  <div className="text-xs text-[var(--muted)]">Total</div>
                  <div className="font-extrabold text-[var(--textDark)]">
                    {resumen.total}
                  </div>
                </div>

                <div className="px-4 py-2 rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary)]/12">
                  <div className="text-xs text-[var(--muted)]">Ocupadas</div>
                  <div className="font-extrabold text-[var(--textDark)]">
                    {resumen.ocupadas}
                  </div>
                </div>

                <div className="px-4 py-2 rounded-2xl border border-[var(--accent)]/25 bg-[var(--card2)]">
                  <div className="text-xs text-[var(--muted)]">Libres</div>
                  <div className="font-extrabold text-[var(--textDark)]">
                    {resumen.libres}
                  </div>
                </div>
              </div>

              {/* botones */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => navigate("/reportes")}
                  className="px-5 py-3 rounded-3xl font-extrabold btn-chifa-outline flex items-center justify-center gap-2"
                >
                  📊 Reportes
                </button>

                <button
                  onClick={cargarMesas}
                  className="px-5 py-3 rounded-3xl font-extrabold btn-chifa-accent flex items-center justify-center gap-2"
                >
                  🔄 Actualizar
                </button>

                <button
                  onClick={() => setMostrarModal(true)}
                  className="px-5 py-3 rounded-3xl font-extrabold btn-chifa flex items-center justify-center gap-2"
                >
                  🔒 Cerrar Jornada
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid mesas */}
      <div className="px-4 sm:px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
          {mesas.map((m) => (
            <MesaCard key={m.id} mesa={m} />
          ))}

          {mesas.length === 0 && (
            <div className="col-span-full text-center text-[var(--muted)] py-12">
              No hay mesas registradas todavía.
            </div>
          )}
        </div>
      </div>

      {/* Modal confirmar cierre */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="card-theme rounded-3xl p-6 w-full max-w-md shadow-2xl border border-[var(--accent)]/25 animate-popIn">
            <h2 className="text-2xl font-extrabold text-[var(--textDark)]">
              🔒 Cerrar jornada
            </h2>
            <p className="text-sm text-[var(--muted)] mt-2">
              Confirma que no haya mesas ocupadas ni pedidos pendientes.
            </p>

            <div className="mt-5">
              <label className="text-sm font-semibold text-[var(--textDark)]">
                Observaciones (para reportes)
              </label>
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Ej: Hubo evento, faltó insumo, etc."
                className="mt-2 w-full min-h-[90px] px-4 py-3 rounded-2xl border border-[var(--accent)]/25 bg-black/20 text-[var(--textDark)] outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setObs("");
                }}
                className="w-full px-4 py-3 rounded-2xl btn-chifa-outline font-extrabold"
              >
                Cancelar
              </button>

              <button
                onClick={cerrarJornada}
                disabled={cerrando}
                className="w-full px-4 py-3 rounded-2xl btn-chifa font-extrabold disabled:opacity-60"
              >
                {cerrando ? "Cerrando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal resultado */}
      {modal && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 px-4 animate-fadeIn">
          <div className="card-theme rounded-3xl shadow-2xl p-8 text-center w-full max-w-sm border border-[var(--accent)]/25 animate-popIn">
            {modal === "success" && (
              <>
                <h2 className="text-xl font-extrabold text-[var(--accent)] mb-2">
                  ✅ {modalMsg}
                </h2>
                <p className="text-[var(--muted)]">Redirigiendo al inicio…</p>
              </>
            )}

            {modal === "error" && (
              <>
                <h2 className="text-xl font-extrabold text-[var(--danger)] mb-2">
                  ❌ {modalMsg}
                </h2>
                <p className="text-[var(--muted)]">
                  Revisa pedidos/mesas y prueba otra vez.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}