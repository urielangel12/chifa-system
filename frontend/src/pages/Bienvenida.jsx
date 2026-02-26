import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Bienvenida() {
  const navigate = useNavigate();

  const [jornada, setJornada] = useState(null);
  const [loading, setLoading] = useState(true);

  const [accionando, setAccionando] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (type, msg, ms = 1800) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), ms);
  };

  const cargarJornadaActual = async () => {
    try {
      const res = await api.get("/jornada/actual");
      setJornada(res.data);
    } catch {
      setJornada(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await cargarJornadaActual();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

 const abrirJornada = async () => {
  try {
    setAccionando(true);
    const res = await api.post("/jornada/abrir"); // ✅ sin observaciones
    setJornada(res.data);
    showToast("success", "✅ Jornada abierta. ¡Listo para atender!");
  } catch (e) {
    console.error(e);
    showToast("error", e.response?.data?.mensaje || e.response?.data?.error || "❌ No se pudo abrir la jornada");
  } finally {
    setAccionando(false);
  }
};


  // ✅ CORRECCIÓN: si existe jornada y estado true => ACTIVA
  const jornadaActiva = !!jornada?.estado;

  if (loading) return <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6">Cargando…</div>;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col">
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

      {/* CONTENIDO PRINCIPAL */}
      <div className="p-6 flex-1">
        <div className="card-theme rounded-3xl shadow-xl p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="chip-accent inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-extrabold">
                🍲 POS Restaurante
              </div>

              <h1 className="mt-4 text-3xl md:text-4xl font-extrabold tracking-tight">
                VELAMI – SNAILIS
              </h1>

           <p className="mt-2 text-[var(--muted)]">
                Control de mesas, pedidos, pagos parciales y reportes por jornada.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <span
  className={[
    "px-4 py-2 rounded-2xl font-semibold",
    "badge-status",
    jornadaActiva ? "is-on" : ""
  ].join(" ")}
>
                  {jornadaActiva ? "✅ Jornada ABIERTA" : "⛔ Jornada CERRADA"}
                </span>

                <span className="px-4 py-2 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/35 text-[var(--textDark)] font-semibold">
                  {jornadaActiva ? `ID: ${jornada?.id}` : "Abre jornada para registrar pedidos"}
                </span>
              </div>
            </div>

            {/* ACCIONES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-[440px]">
              {/* ✅ Si jornada está abierta => ir a mesas; si está cerrada => abrir modal */}
              <button
                onClick={() => (jornadaActiva ? navigate("/mesas") : abrirJornada())}
                className={[
  "px-5 py-4 rounded-3xl font-extrabold transition",
  "flex items-center justify-between gap-3",
  "btn-chifa",
].join(" ")}
              >
                <span>{jornadaActiva ? "🍽️ Ir a Mesas" : "🔓 Abrir Jornada"}</span>
                <span className="text-xl">→</span>
              </button>

              {/* ✅ Reportes SIEMPRE disponibles */}
              <button
                onClick={() => navigate("/reportes")}
                className="px-5 py-4 rounded-3xl font-extrabold btn-chifa-outline transition flex items-center justify-between gap-3"
              >
                <span>📊 Reportes</span>
                <span className="text-xl">→</span>
              </button>

              <button
                onClick={async () => {
                  await cargarJornadaActual();
                  showToast("info", "🔄 Estado actualizado");
                }}
               className="px-5 py-4 rounded-3xl font-bold btn-chifa-accent transition flex items-center justify-between gap-3 sm:col-span-2"
              >
                <span>🔄 Actualizar estado</span>
                <span className="text-xl">↻</span>
              </button>
            </div>
          </div>

          {/* CARDS */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Mesas" desc="Atiende rápido por mesa y controla pedidos." icon="🪑" />
            <Card title="Pagos" desc="Pago total o parcial (Efectivo / Yape)." icon="💳" />
            <Card title="Reportes" desc="Diario / Mensual / Semestral en Excel." icon="📈" />
          </div>
        </div>
      </div>

      {/* ✅ IMAGEN ABAJO (rellena el espacio) */}
      <div className="px-6 pb-6">
        <div className="rounded-3xl overflow-hidden border border-[var(--accent)]/20 shadow-xl bg-[var(--card2)]">
          <div className="relative h-[220px] md:h-[260px]">
            <img
              src="/hero-gruta.jpg"
              alt="La Gruta - Cocharcas"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="text-lg md:text-xl font-extrabold">
                Platos • Makis • Broaster • Bebidas
              </div>
              <div className="text-sm opacity-90">
                Menú CHIFA — Rápido y moderno
              </div>
            </div>
          </div>
        </div>
      </div>

    
    </div>
  );
}

function Card({ title, desc, icon }) {
  return (
  <div className="rounded-3xl bg-[var(--card)] text-[var(--textDark)] shadow-sm p-6 hover:shadow-xl transition">
  <div className="flex items-center gap-3">
    <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/20 flex items-center justify-center text-2xl">
      {icon}
    </div>
    <div>
      <div className="font-extrabold">{title}</div>
      <div className="text-sm text-[var(--muted)] mt-1">{desc}</div>
    </div>
  </div>
</div>
  );
}
