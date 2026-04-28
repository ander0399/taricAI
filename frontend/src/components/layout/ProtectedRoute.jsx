import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

/**
 * @description Guard de ruta. Verifica que exista un JWT válido antes de
 *              renderizar el componente hijo. Si no hay token, preserva la
 *              ruta actual en el query param ?redirect para retomar después
 *              del login. No redirige a / para no perder el contexto del usuario.
 * @returns {JSX.Element} <Outlet /> si autenticado | <Navigate> a /login?redirect=... si no
 */
const ProtectedRoute = () => {
  const token    = useSelector((s) => s.auth.token);
  const location = useLocation();

  if (!token) {
    // Preservar la ruta que el usuario intentaba visitar para retomar después del login
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
