import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout as logoutAction } from '../store/slices/authSlice';

/**
 * @description Hook central de autenticación. Provee acceso al estado del
 *              usuario, el plan activo y la función de logout con redirect a /.
 *              Usar en cualquier componente que necesite datos de sesión o
 *              ejecutar el cierre de sesión.
 * @returns {{
 *   user:            object | null,
 *   company:         object | null,
 *   plan:            'free' | 'pro' | 'team' | 'enterprise' | null,
 *   isAuthenticated: boolean,
 *   isOwner:         boolean,
 *   logout:          () => void
 * }}
 */
const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, company, token } = useSelector((s) => s.auth);

  /**
   * @description Cierra la sesión del usuario de forma limpia.
   *              El reducer logout() ya limpia el JWT de localStorage y el estado Redux.
   *              Redirige a / porque el cierre voluntario lleva al punto de entrada
   *              natural (Landing Page), no al login.
   */
  const logout = () => {
    dispatch(logoutAction());
    navigate('/', { replace: true });
  };

  return {
    user,
    company,
    plan:            company?.plan ?? null,
    isAuthenticated: Boolean(token),
    isOwner:         user?.role === 'owner',
    logout,
  };
};

export default useAuth;
