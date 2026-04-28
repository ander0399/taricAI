import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { createCheckoutSession } from '../services/stripeService';

/**
 * @description Botón de compra con lógica de autenticación y redirección a Stripe Checkout.
 *              Si el usuario no está autenticado, redirige a /register?plan=X para retomar
 *              el flujo de checkout tras el registro.
 *              Si está autenticado, llama al backend y redirige a la URL de Stripe.
 * @param {'pro'|'team'} planId - Plan a comprar
 * @param {string} label - Texto del botón
 * @param {string} className - Clases Tailwind del botón
 * @returns {JSX.Element}
 */
export default function StripeBuyButton({ planId, label, className }) {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!user) {
      navigate(`/register?plan=${planId}`);
      return;
    }

    setLoading(true);
    try {
      const { url } = await createCheckoutSession(planId);
      if (url) window.location.href = url;
    } catch {
      navigate(`/register?plan=${planId}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className={className}>
      {loading
        ? <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Redirigiendo...</span>
        : label
      }
    </button>
  );
}
