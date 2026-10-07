import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  rolPermitido: string;
}

export default function ProtectedRoute({ children, rolPermitido }: Props) {
  const token = localStorage.getItem('token');
  const rol = localStorage.getItem('rol');

  if (!token) return <Navigate to="/login" replace />;

  let rolesValidos: string[];
  if (rolPermitido === 'MESERA') {
    rolesValidos = ['MESERA', 'MESERO', 'ADMIN'];
  } else if (rolPermitido === 'CAJERO') {
    rolesValidos = ['CAJERO', 'ADMIN'];
  } else {
    rolesValidos = [rolPermitido];
  }

  if (!rol || !rolesValidos.includes(rol)) {
    if (rol === 'MESERO' || rol === 'MESERA') return <Navigate to="/mesera/mesas" replace />;
    if (rol === 'CAJERO') return <Navigate to="/cajero/dashboard" replace />;
    if (rol === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}