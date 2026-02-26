import { useMemo, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Reportes() {
  const navigate = useNavigate();

  const hoy = new Date();
  const currentYear = hoy.getFullYear();
  const currentMonth = String(hoy.getMonth() + 1).padStart(2, "0");
  const currentDay = String(hoy.getDate()).padStart(2, "0");
  const fechaHoy = `${currentYear}-${currentMonth}-${currentDay}`;

  const [tipo, setTipo] = useState("DIARIO"); // DIARIO | MENSUAL | SEMESTRAL
  const [fecha, setFecha] = useState(fechaHoy);

  const [anio, setAnio] = useState(String(currentYear));
  const [mes, setMes] = useState(currentMonth);
  const [semestre, setSemestre] = useState(hoy.getMonth() < 6 ? "1" : "2");

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg, ms = 2000) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), ms);
  };

  const titulo = useMemo(() => {
    if (tipo === "DIARIO") return `Reporte diario • ${fecha}`;
    if (tipo === "MENSUAL") return `Reporte mensual • ${mes}/${anio}`;
    return `Reporte semestral • S${semestre} ${anio}`;
  }, [tipo, fecha, mes, anio, semestre]);

  const descargar = async () => {
    try {
      setLoading(true);

      let url = "";
      let fileName = "reporte.xlsx";

      if (tipo === "DIARIO") {
        url = `/reportes/diario?fecha=${fecha}`;
        fileName = `reporte-diario-${fecha}.xlsx`;
      } else if (tipo === "MENSUAL") {
        url = `/reportes/mensual?anio=${anio}&mes=${mes}`;
        fileName = `reporte-mensual-${anio}-${mes}.xlsx`;
      } else {
        url = `/reportes/semestral?anio=${anio}&semestre=${semestre}`;
        fileName = `reporte-semestral-${anio}-S${semestre}.xlsx`;
      }

      const res = await api.get(url, { responseType: "blob" });

      const blob = new Blob([res.data], {
        type:
          res.headers["content-type"] ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();

      showToast("success", "✅ Reporte descargado");
    } catch (e) {
      console.error(e);
      showToast("error", e.response?.data?.mensaje || "❌ No se pudo generar el reporte");
    } finally {
      setLoading(false);
    }
  };

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
              onClick={() => navigate("/")}
              className="mb-3 inline-flex items-center gap-2 px-4 py-2 rounded-2xl
                         bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold"
            >
              ← Volver a Bienvenida
            </button>

            <div className="chip-accent inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-extrabold">
              📊 Reportes
            </div>

            <h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--textDark)]">
              Panel de reportes (Excel)
            </h1>
            <p className="text-[var(--muted)] mt-1">
              Descarga reportes sin necesidad de abrir jornada.
            </p>
          </div>

          <div className="px-5 py-3 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/35">
            <div className="text-xs text-[var(--muted)]">Seleccionado</div>
            <div className="text-lg font-extrabold text-[var(--textDark)]">{titulo}</div>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* CONFIG */}
        <div className="card-theme rounded-3xl shadow-xl p-5 sm:p-6 xl:col-span-2">
          <div className="flex gap-2 flex-wrap">
            <Tab label="📅 Diario" active={tipo === "DIARIO"} onClick={() => setTipo("DIARIO")} />
            <Tab label="🗓️ Mensual" active={tipo === "MENSUAL"} onClick={() => setTipo("MENSUAL")} />
            <Tab label="📆 Semestral" active={tipo === "SEMESTRAL"} onClick={() => setTipo("SEMESTRAL")} />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {tipo === "DIARIO" && (
              <>
                <Field label="Fecha">
                  <input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/10
                               text-[var(--textDark)] outline-none
                               focus:ring-2 focus:ring-[var(--accent)]/40"
                  />
                </Field>
                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={descargar}
                    disabled={loading}
                    className="w-full px-5 py-3 rounded-2xl font-extrabold shadow border border-[var(--accent)]/40
                               bg-[var(--accent)] hover:bg-[var(--accentHover)] text-black disabled:opacity-60"
                  >
                    {loading ? "Generando..." : "⬇️ Descargar Excel"}
                  </button>
                </div>
              </>
            )}

            {tipo === "MENSUAL" && (
              <>
                <Field label="Año">
                  <input
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/10
                               text-[var(--textDark)] outline-none
                               focus:ring-2 focus:ring-[var(--accent)]/40"
                    placeholder="2026"
                  />
                </Field>

                <Field label="Mes">
                  <select
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/10
                               text-[var(--textDark)] outline-none
                               focus:ring-2 focus:ring-[var(--accent)]/40"
                  >
                    {Array.from({ length: 12 }).map((_, i) => {
                      const mm = String(i + 1).padStart(2, "0");
                      return (
                        <option key={mm} value={mm} className="bg-[#0f0f10]">
                          {mm}
                        </option>
                      );
                    })}
                  </select>
                </Field>

                <div className="flex items-end">
                  <button
                    onClick={descargar}
                    disabled={loading}
                    className="w-full px-5 py-3 rounded-2xl font-extrabold shadow border border-[var(--accent)]/40
                               bg-[var(--accent)] hover:bg-[var(--accentHover)] text-black disabled:opacity-60"
                  >
                    {loading ? "Generando..." : "⬇️ Descargar Excel"}
                  </button>
                </div>
              </>
            )}

            {tipo === "SEMESTRAL" && (
              <>
                <Field label="Año">
                  <input
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/10
                               text-[var(--textDark)] outline-none
                               focus:ring-2 focus:ring-[var(--accent)]/40"
                    placeholder="2026"
                  />
                </Field>

                <Field label="Semestre">
                  <select
                    value={semestre}
                    onChange={(e) => setSemestre(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-white/10 bg-white/10
                               text-[var(--textDark)] outline-none
                               focus:ring-2 focus:ring-[var(--accent)]/40"
                  >
                    <option value="1" className="bg-[#0f0f10]">Semestre 1 (Ene–Jun)</option>
                    <option value="2" className="bg-[#0f0f10]">Semestre 2 (Jul–Dic)</option>
                  </select>
                </Field>

                <div className="flex items-end">
                  <button
                    onClick={descargar}
                    disabled={loading}
                    className="w-full px-5 py-3 rounded-2xl font-extrabold shadow border border-[var(--accent)]/40
                               bg-[var(--accent)] hover:bg-[var(--accentHover)] text-black disabled:opacity-60"
                  >
                    {loading ? "Generando..." : "⬇️ Descargar Excel"}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 rounded-3xl bg-white/10 border border-white/10 p-5">
            <h3 className="font-extrabold text-[var(--textDark)]">📌 Nota</h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Reportes funcionan incluso si la jornada está cerrada (ideal para el dueño).
            </p>
          </div>
        </div>

        {/* RESUMEN */}
        <div className="card-theme rounded-3xl shadow-xl p-5 sm:p-6">
          <h2 className="text-xl font-extrabold text-[var(--textDark)]">📈 Resumen</h2>
          <p className="text-sm text-[var(--muted)] mt-1">
            Luego aquí metemos KPIs: total vendido, # pagos, top platos.
          </p>

          <div className="mt-5 space-y-3">
            <MiniStat
              label="Tipo"
              value={tipo === "DIARIO" ? "Diario" : tipo === "MENSUAL" ? "Mensual" : "Semestral"}
            />
            <MiniStat
              label="Periodo"
              value={tipo === "DIARIO" ? fecha : tipo === "MENSUAL" ? `${mes}/${anio}` : `S${semestre} ${anio}`}
            />
            <MiniStat label="Formato" value="Excel (.xlsx)" />
          </div>

          <div className="mt-6 h-px bg-white/10" />

          <button
            onClick={() => navigate("/")}
            className="mt-5 w-full px-5 py-3 rounded-2xl font-extrabold shadow
                       bg-white/10 hover:bg-white/15 border border-white/10 text-[var(--textDark)]"
          >
            🏠 Volver a Bienvenida
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
          ? "bg-[var(--primary)] hover:bg-[var(--primaryHover)] text-white border-white/10"
          : "bg-white/10 border-white/10 text-[var(--textDark)] hover:bg-white/15",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-sm font-extrabold mb-2 text-[var(--textDark)]">{label}</div>
      {children}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="px-4 py-3 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/35">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className="text-lg font-extrabold text-[var(--textDark)]">{value}</div>
    </div>
  );
}