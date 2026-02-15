import { BrowserRouter, Routes, Route } from "react-router-dom";
import Bienvenida from "./pages/Bienvenida";
import Mesas from "./pages/Mesas";
import MesaDetalle from "./pages/MesaDetalle";
import Pago from "./pages/Pago";
import Reportes from "./pages/Reportes";



export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Bienvenida />} />
        <Route path="/mesas" element={<Mesas />} />
        <Route path="/mesas/:id" element={<MesaDetalle />} />
        <Route path="/pago/:pedidoId" element={<Pago />} />
        <Route path="/reportes" element={<Reportes />} />

      </Routes>
    </BrowserRouter>
  );
}



