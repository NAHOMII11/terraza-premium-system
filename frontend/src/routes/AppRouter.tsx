import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Mesas from '../pages/Mesas';
import Inventario from '../pages/Inventario';
import TomarPedido from '../pages/TomarPedido';
import PedidosActivos from '../pages/PedidosActivos';
import Productos from '../pages/Productos';
import ProtectedRoute from './ProtectedRoute';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/mesera/mesas"
          element={
            <ProtectedRoute rolPermitido="MESERA">
              <Mesas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mesera/inventario"
          element={
            <ProtectedRoute rolPermitido="MESERA">
              <Inventario />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mesera/pedido/:mesaId"
          element={
            <ProtectedRoute rolPermitido="MESERA">
              <TomarPedido />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mesera/pedidos"
          element={
            <ProtectedRoute rolPermitido="MESERA">
              <PedidosActivos />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mesera/productos"
          element={
            <ProtectedRoute rolPermitido="MESERA">
              <Productos />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}