import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';

const TOKEN_KEY = 'taricai_token';

const ProtectedRoute = () => {
  const token    = useSelector((s) => s.auth.token);
  const dispatch = useDispatch();
  const location = useLocation();

  // Bfcache fix: el navegador puede restaurar el estado JS anterior (incluyendo
  // el token de Redux) al presionar Atrás después de cerrar sesión. Si el token
  // ya no existe en localStorage, la sesión fue cerrada y hay que limpiar Redux.
  useEffect(() => {
    const handlePageShow = (e) => {
      if (e.persisted && !localStorage.getItem(TOKEN_KEY)) {
        dispatch(logout());
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [dispatch]);

  if (!token) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
