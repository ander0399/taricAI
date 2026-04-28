import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
import { sendEnterpriseContact } from '../services/stripeService';

const COUNTRIES = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador',
  'El Salvador', 'España', 'Estados Unidos', 'Guatemala', 'Honduras', 'México', 'Nicaragua',
  'Panamá', 'Paraguay', 'Perú', 'República Dominicana', 'Uruguay', 'Venezuela',
  'Alemania', 'Francia', 'Italia', 'Portugal', 'Reino Unido', 'Países Bajos', 'Bélgica',
  'Polonia', 'Suecia', 'Suiza', 'China', 'Japón', 'India', 'Corea del Sur', 'Singapur',
  'Australia', 'Canadá', 'Sudáfrica', 'Nigeria', 'Turquía', 'Emiratos Árabes Unidos', 'Otro',
];

const VOLUME_OPTIONS = [
  { value: '', label: 'Volumen estimado de operaciones/mes (opcional)' },
  { value: '<100', label: 'Menos de 100 operaciones/mes' },
  { value: '100-500', label: '100 – 500 operaciones/mes' },
  { value: '500-2000', label: '500 – 2,000 operaciones/mes' },
  { value: '2000+', label: 'Más de 2,000 operaciones/mes' },
];

const EMPTY_FORM = {
  name: '', email: '', company: '', country: '', usersCount: '', volume: '', message: '',
};

/**
 * @description Modal de contacto Enterprise. Recoge datos corporativos y envía el lead
 *              al backend vía POST /api/enterprise/contact. No inicia ningún flujo de Stripe.
 * @param {boolean} isOpen - Controla visibilidad del modal
 * @param {Function} onClose - Callback para cerrar el modal
 * @returns {JSX.Element}
 */
export default function EnterpriseContactModal({ isOpen, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    // Limitar textarea de mensaje a 500 caracteres
    if (name === 'message' && value.length > 500) return;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendEnterpriseContact({
        ...form,
        usersCount: Number(form.usersCount),
      });
      setSent(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al enviar. Por favor intenta de nuevo.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSent(false);
    setError('');
    setForm(EMPTY_FORM);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Plan Enterprise</h2>
            <p className="text-slate-400 text-sm mb-5">
              Cuéntanos sobre tu organización y un consultor senior te contactará en menos de 24 horas.
            </p>

            {sent ? (
              <div className="text-center py-8">
                <p className="text-emerald-400 text-lg font-semibold">
                  ✅ Tu solicitud fue enviada.
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  Nos pondremos en contacto en menos de 24 horas.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-6 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Nombre completo */}
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Nombre completo *"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />

                {/* Email corporativo */}
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email corporativo *"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />

                {/* Empresa */}
                <input
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Empresa / Organización *"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />

                <div className="grid grid-cols-2 gap-3">
                  {/* País de operación — select */}
                  <select
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    required
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
                  >
                    <option value="" disabled className="text-slate-500">País de operación *</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  {/* Número de usuarios — mínimo 15 */}
                  <input
                    name="usersCount"
                    type="number"
                    min="15"
                    value={form.usersCount}
                    onChange={handleChange}
                    placeholder="Usuarios (mín. 15) *"
                    required
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Volumen de operaciones — opcional */}
                <select
                  name="volume"
                  value={form.volume}
                  onChange={handleChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
                >
                  {VOLUME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} disabled={!o.value} className={!o.value ? 'text-slate-500' : ''}>
                      {o.label}
                    </option>
                  ))}
                </select>

                {/* Mensaje — opcional, máx. 500 chars */}
                <div>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Describe tus necesidades específicas... (opcional)"
                    rows={3}
                    maxLength={500}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <p className="text-right text-slate-500 text-xs mt-1">{form.message.length}/500</p>
                </div>

                {error && <p className="text-rose-400 text-xs">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-lg py-2.5 font-semibold text-sm transition"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {loading ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
