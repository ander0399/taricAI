import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * @description Página de confirmación post-Stripe Checkout.
 *              NO activa la suscripción — eso lo hace el webhook checkout.session.completed.
 *              Solo muestra un mensaje de confirmación mientras el webhook procesa en segundo plano.
 * @returns {JSX.Element}
 */
export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(8);

  // Contador regresivo para redirigir al dashboard automáticamente
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <CheckCircle size={64} className="text-emerald-400" />
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-3">¡Pago exitoso!</h1>

        <p className="text-slate-400 mb-2">
          Tu suscripción está siendo activada. Este proceso toma unos segundos.
        </p>
        <p className="text-slate-500 text-sm mb-8">
          Recibirás un email de confirmación con los detalles de tu plan.
        </p>

        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm mb-6">
          <Loader2 size={16} className="animate-spin" />
          <span>Activando tu plan...</span>
        </div>

        <button
          onClick={() => navigate('/dashboard', { replace: true })}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-3 font-bold transition"
        >
          Ir al Dashboard
        </button>

        <p className="text-slate-600 text-xs mt-4">
          Redirigiendo automáticamente en {countdown} segundos...
        </p>
      </motion.div>
    </div>
  );
}
