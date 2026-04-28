import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Globe, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { registerOwner, clearError } from '../store/slices/authSlice';
import { createCheckoutSession } from '../services/stripeService';
import { pageEnter } from '../styles/animations';

const PAID_PLANS = ['pro', 'team'];

const PLAN_BANNER = {
  pro:  'Estás registrándote para el Plan Pro ($49/mes). Serás redirigido a Stripe para completar el pago.',
  team: 'Estás registrándote para el Plan Team ($29/seat/mes). Serás redirigido a Stripe para completar el pago.',
};

const RegisterOwner = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error, token } = useSelector((s) => s.auth);

  const planFromUrl = searchParams.get('plan') || 'free';
  const initialPlan = ['free', 'pro', 'team'].includes(planFromUrl) ? planFromUrl : 'free';

  const [form, setForm] = useState({
    nombreEmpresa: '', plan: initialPlan, nombre: '', email: '', password: '',
  });
  const [showPassword, setShowPassword]   = useState(false);
  const [success, setSuccess]             = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true });
  }, [token, navigate]);

  useEffect(() => () => dispatch(clearError()), [dispatch]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(registerOwner({ ...form, plan: 'free' }));

    if (!registerOwner.fulfilled.match(result)) return;

    setSuccess(true);

    // Si el usuario llegó desde un botón de plan de pago, retomar el flujo Stripe
    if (PAID_PLANS.includes(form.plan)) {
      setCheckoutLoading(true);
      try {
        const { url } = await createCheckoutSession(form.plan);
        if (url) {
          window.location.href = url;
          return;
        }
      } catch {
        // Si Stripe falla el usuario queda en Free y puede reintentarlo desde Mi Plan
      }
    }

    setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
  };

  const isSubmitting = loading || checkoutLoading;

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden flex items-center justify-center px-4 py-8">

      {/* Overlay decorativo: cuadrícula de puntos */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-slate-900 pointer-events-none" />

      {/* Card central */}
      <motion.div
        {...pageEnter}
        className="relative bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-slate-950/50"
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
        <h1 className="text-2xl font-bold text-white mb-1">Crea tu cuenta</h1>
        <p className="text-sm text-slate-400 mb-6">Registra tu empresa en Taric AI — gratis para empezar</p>

        {/* Banner de plan de pago seleccionado */}
        {PAID_PLANS.includes(form.plan) && (
          <div className="mb-4 bg-blue-600/20 border border-blue-500/40 rounded-xl p-4">
            <p className="text-blue-300 text-sm">{PLAN_BANNER[form.plan]}</p>
          </div>
        )}

        {/* Éxito */}
        {success && !checkoutLoading && (
          <div className="mb-4 bg-emerald-600/20 border border-emerald-500/40 rounded-xl p-4">
            <p className="text-emerald-300 text-sm">Cuenta creada. Redirigiendo al dashboard...</p>
          </div>
        )}

        {/* Redirigiendo a Stripe */}
        {checkoutLoading && (
          <div className="mb-4 bg-blue-600/20 border border-blue-500/40 rounded-xl p-4">
            <p className="text-blue-300 text-sm">Redirigiendo al pago seguro con Stripe...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 bg-red-600/20 border border-red-500/40 rounded-xl p-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Nombre de la empresa
            </label>
            <input
              name="nombreEmpresa"
              value={form.nombreEmpresa}
              onChange={handleChange}
              placeholder="Importaciones García S.A."
              required
              className="bg-slate-800 border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none transition w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              Tu nombre completo
            </label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ana García"
              required
              className="bg-slate-800 border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none transition w-full"
            />
          </div>

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
                placeholder="Mínimo 8 caracteres"
                minLength={8}
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
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2.5 font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creando cuenta...
              </>
            ) : (
              'Crear cuenta gratis'
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
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-blue-400 font-medium hover:text-blue-300 transition-colors duration-200">
            Inicia sesión →
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterOwner;
