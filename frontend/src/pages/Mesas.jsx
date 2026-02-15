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
    setMesas(res.data);
  };

 useEffect(() => {
  cargarMesas();
  const t = setInterval(cargarMesas, 2500);
  return () => clearInterval(t);
}, []);
useEffect(() => {
  const onFocus = () => cargarMesas();
  window.addEventListener("focus", onFocus);
  return () => window.removeEventListener("focus", onFocus);
}, []);



  const resumen = useMemo(() => {
    const total = mesas.length;
    const ocupadas = mesas.filter(m => m.estado === "OCUPADA").length;
    const libres = total - ocupadas;
    return { total, ocupadas, libres };
  }, [mesas]);

  const cerrarJornada = async () => {
    try {
      setCerrando(true);

      const res = await api.post("/jornada/cerrar", {
  observaciones: obs
});setObs("");
 // ✅ tu app.js usa /api/jornada

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
          "group relative text-left rounded-2xl p-5 shadow-md border",
          "transition-all duration-200 hover:-translate-y-1 hover:shadow-xl",
          "backdrop-blur",
         ocupada
  ? "bg-[#7A2E2E]/10 border-[#7A2E2E]/30"
  : "bg-[#2F6B4F]/10 border-[#2F6B4F]/30",

        ].join(" ")}
      >
        {/* Badge estado */}
        <div className="absolute top-4 right-4">
          <span
            className={[
              "px-3 py-1 rounded-full text-xs font-semibold tracking-wide",
              ocupada
                ? "bg-[#7A2E2E]/10 text-[#7A2E2E]"
                : "bg-[#2F6B4F]/10 text-[#2F6B4F]",
            ].join(" ")}
          >
            {ocupada ? "OCUPADA" : "LIBRE"}
          </span>
        </div>

        {/* Icono */}
        <div
          className={[
            "w-12 h-12 rounded-2xl flex items-center justify-center mb-4",
            ocupada ? "bg-[#7A2E2E]/10" : "bg-[#B08D57]/12",
          ].join(" ")}
        >
          <span className="text-2xl">{ocupada ? "🍲" : "🪑"}</span>
        </div>

        {/* Texto */}
        <div className="text-[#2B1B12]">
          <div className="text-sm text-[#6B5B52]">Mesa</div>
          <div className="text-2xl font-extrabold tracking-tight">
            {mesa.numero}
          </div>
        </div>

        <div className="mt-4 text-sm text-[#6B5B52]">
          {ocupada ? "En atención" : "Disponible"}
        </div>

        {/* Línea decorativa */}
        <div className="mt-4 h-px bg-black/5" />

        <div className="mt-3 text-xs text-[#6B5B52] flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#B08D57]" />
          La Gruta • Cocharcas
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F2E8] text-[#2B1B12]">
      {/* Top bar */}
      <div className="px-6 pt-6">
        <div className="rounded-3xl bg-white/70 backdrop-blur border border-black/5 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                LA GRUTA – COCHARCAS
              </h1>
              <p className="text-[#6B5B52] mt-1">
                Panel de Mesas • Gestión diaria del restaurante
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* resumen */}
              <div className="flex gap-2">
                <div className="px-4 py-2 rounded-2xl bg-[#B08D57]/10 border border-[#B08D57]/20">
                  <div className="text-xs text-[#6B5B52]">Total</div>
                  <div className="font-bold">{resumen.total}</div>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-[#7A2E2E]/10 border border-[#7A2E2E]/20">
                  <div className="text-xs text-[#6B5B52]">Ocupadas</div>
                  <div className="font-bold">{resumen.ocupadas}</div>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-[#2F6B4F]/10 border border-[#2F6B4F]/20">
                  <div className="text-xs text-[#6B5B52]">Libres</div>
                  <div className="font-bold">{resumen.libres}</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
  <button
    onClick={() => navigate("/reportes")}
    className="px-5 py-3 rounded-2xl bg-[#B08D57] hover:bg-[#9A7B4D] text-white font-semibold shadow"
  >
    📊 Reportes
  </button>

  <button
    onClick={cargarMesas}
    className="px-5 py-3 rounded-2xl bg-black/5 hover:bg-black/10 text-[#2B1B12] font-semibold"
  >
    🔄 Actualizar
  </button>

  <button
    onClick={() => setMostrarModal(true)}
    className="px-5 py-3 rounded-2xl bg-[#7A2E2E] hover:bg-[#5F2323] text-white font-semibold shadow"
  >
    🔒 Cerrar Jornada
  </button>
</div>

            </div>
          </div>
        </div>
      </div>

      {/* Grid mesas */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-5">
          {mesas.map(m => (
            <MesaCard key={m.id} mesa={m} />
          ))}
          {mesas.length === 0 && (
  <div className="col-span-full text-center text-[#6B5B52] py-12">
    No hay mesas registradas todavía.
  </div>
)}

        </div>
      </div>

      {/* Modal confirmar cierre */}
     {mostrarModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 animate-fadeIn">
    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-black/10 animate-popIn">
      <h2 className="text-2xl font-extrabold">🔒 Cerrar jornada</h2>
      <p className="text-sm text-[#6B5B52] mt-2">
        Confirma que no haya mesas ocupadas ni pedidos pendientes.
      </p>

      {/* Observaciones */}
      <div className="mt-5">
        <label className="text-sm font-semibold text-[#2B1B12]">
          Observaciones (para reportes)
        </label>
        <textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Ej: Día domingo, hubo evento, se acabó trucha, etc."
          className="mt-2 w-full min-h-[90px] px-4 py-3 rounded-2xl border border-black/10 bg-white outline-none focus:ring-2 focus:ring-[#B08D57]/40"
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => {
            setMostrarModal(false);
            setObs("");
          }}
          className="w-full bg-black/5 hover:bg-black/10 text-[#2B1B12] font-semibold py-3 rounded-2xl"
        >
          Cancelar
        </button>

        <button
          onClick={cerrarJornada}
          disabled={cerrando}
          className="w-full bg-[#7A2E2E] hover:bg-[#5F2323] text-white font-semibold py-3 rounded-2xl disabled:opacity-60"
        >
          {cerrando ? "Cerrando..." : "Confirmar"}
        </button>
      </div>
    </div>
  </div>
)}


      {/* Modal resultado */}
      {modal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4 animate-fadeIn">
    <div className="bg-white rounded-3xl shadow-2xl p-8 text-center w-full max-w-sm border border-black/10 animate-popIn">

            {modal === "success" && (
              <>
                <h2 className="text-xl font-extrabold text-[#2F6B4F] mb-2">
                  ✅ {modalMsg}
                </h2>
                <p className="text-[#6B5B52]">Redirigiendo al inicio…</p>
              </>
            )}

            {modal === "error" && (
              <>
                <h2 className="text-xl font-extrabold text-[#7A2E2E] mb-2">
                  ❌ {modalMsg}
                </h2>
                <p className="text-[#6B5B52]">Revisa pedidos/mesas y prueba otra vez.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
