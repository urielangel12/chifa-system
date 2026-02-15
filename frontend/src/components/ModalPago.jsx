export default function ModalPago({ total, onConfirmar, onCerrar }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-80">
        <h2 className="text-xl font-bold mb-4 text-center">
          Total a cobrar
        </h2>

        <p className="text-2xl font-bold text-center mb-6">
          S/. {total.toFixed(2)}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => onConfirmar("efectivo")}
            className="w-full bg-blue-600 text-white py-2 rounded-xl"
          >
            💵 Efectivo
          </button>

          <button
            onClick={() => onConfirmar("yape")}
            className="w-full bg-purple-600 text-white py-2 rounded-xl"
          >
            📱 Yape / Plin
          </button>

          <button
            onClick={() => onConfirmar("tarjeta")}
            className="w-full bg-gray-800 text-white py-2 rounded-xl"
          >
            💳 Tarjeta
          </button>
        </div>

        <button
          onClick={onCerrar}
          className="mt-4 w-full text-gray-500"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
