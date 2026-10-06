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
    rolesValidos = ['MESERA', 'MESERO'];
  } else {
    rolesValidos = [rolPermitido];
  }

  if (!rol || !rolesValidos.includes(rol)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}