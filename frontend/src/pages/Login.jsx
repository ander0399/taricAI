import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Globe, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { login, clearError } from '../store/slices/authSlice';
import { pageEnter } from '../styles/animations';

const Login = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error, token } = useSelector((s) => s.auth);

  const [form, setForm]           = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake]         = useState(false);

  // Si ya autenticado, redirigir inmediatamente al dashboard
  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true });
  }, [token, navigate]);

  useEffect(() => () => dispatch(clearError()), [dispatch]);

  // Activar shake animation al recibir un error de credenciales
  useEffect(() => {
    if (error) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login(form));
    if (login.fulfilled.match(result)) {
      // Si hay ?redirect en la URL, retomar el flujo anterior al vencimiento de sesión
      const redirectTo = searchParams.get('redirect') || '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden flex items-center justify-center px-4">

      {/* Overlay decorativo: cuadrícula de puntos */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      {/* Gradiente de acento */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-slate-900 pointer-events-none" />

      {/* Card central */}
      <motion.div
        {...pageEnter}
        className={`relative bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-slate-950/50 ${shake ? 'animate-shake' : ''}`}
      >
        {/* Fila superior: botón Volver + logo */}
        <div className="flex items-center justify-between mb-7">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors duration-200 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </button>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" />
            <span className="text-white font-bold text-base">Taric AI</span>
          </div>
        </div>

        {/* Encabezado */}
        <h1 className="text-2xl font-bold text-white mb-1">Bienvenido de vuelta</h1>
        <p className="text-sm text-slate-400 mb-6">Inicia sesión en tu cuenta de Taric AI</p>

        {/* Error de credenciales */}
        {error && (
          <div className="mb-5 bg-red-600/20 border border-red-500/40 rounded-xl p-4 flex items-start gap-3">
            <span className="text-red-300 text-sm leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Correo electrónico
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ana@empresa.com"
              required
              className="bg-slate-800 border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none transition w-full"
            />
          </div>

          {/* Contraseña con toggle */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="bg-slate-800 border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl px-4 py-3 pr-11 text-white placeholder-slate-500 outline-none transition w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex justify-end mt-1.5">
              <Link
                to="/forgot-password"
                className="text-xs text-slate-400 hover:text-white transition-colors duration-200"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2.5 font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Divisor */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs text-slate-500">o</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        <p className="text-center text-sm text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-blue-400 font-medium hover:text-blue-300 transition-colors duration-200">
            Regístrate gratis →
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
