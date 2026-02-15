import { useNavigate } from "react-router-dom";

export default function Bienvenida() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-amber-100 to-orange-200">
      <h1 className="text-4xl font-bold mb-4">
        Bienvenido, Nerio Rondón Mantari
      </h1>

      <p className="text-lg italic mb-8">
        “Recuerda: un buen servicio hoy, es un cliente mañana. Todo irá bien.”
      </p>

      <button
        onClick={() => navigate("/mesas")}
        className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition"
      >
        Entrar al sistema
      </button>
    </div>
  );
}
