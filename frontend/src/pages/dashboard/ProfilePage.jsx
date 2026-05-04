import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Building2, CreditCard } from 'lucide-react';
import { updateUser } from '../../store/slices/authSlice';
import { updateProfile, changePasswordApi } from '../../services/profile.api';
import DashboardNavbar from '../../components/layout/DashboardNavbar';
import { pageEnter } from '../../styles/animations';

const PLAN_BADGE = {
  free:       'bg-slate-700 text-slate-300 border border-slate-600',
  pro:        'bg-blue-600/20 text-blue-300 border border-blue-500/30',
  team:       'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
  enterprise: 'bg-purple-600/20 text-purple-300 border border-purple-500/30',
};
const PLAN_LABEL = { free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' };

const ROLE_LABEL = { owner: 'Propietario', admin: 'Administrador', member: 'Miembro' };

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { user, company } = useSelector((s) => s.auth);
  const plan = company?.plan || 'free';

  const [nombre, setNombre]         = useState(user?.nombre || '');
  const [savingNombre, setSavingNombre] = useState(false);
  const [nombreMsg, setNombreMsg]   = useState(null);

  const [pw, setPw]         = useState({ actual: '', nuevo: '', confirmar: '' });
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg]   = useState(null);

  const initials = user?.nombre
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const handleSaveNombre = async () => {
    if (!nombre.trim() || nombre.trim() === user?.nombre) return;
    setSavingNombre(true);
    setNombreMsg(null);
    try {
      await updateProfile({ nombre: nombre.trim() });
      dispatch(updateUser({ nombre: nombre.trim() }));
      setNombreMsg({ ok: true, text: 'Nombre actualizado correctamente.' });
    } catch {
      setNombreMsg({ ok: false, text: 'Error al actualizar el nombre.' });
    } finally {
      setSavingNombre(false);
    }
  };

  const handleChangePw = async () => {
    setPwMsg(null);
    if (!pw.actual || !pw.nuevo || !pw.confirmar) {
      setPwMsg({ ok: false, text: 'Completa todos los campos.' });
      return;
    }
    if (pw.nuevo !== pw.confirmar) {
      setPwMsg({ ok: false, text: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    if (pw.nuevo.length < 6) {
      setPwMsg({ ok: false, text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    setSavingPw(true);
    try {
      await changePasswordApi({ passwordActual: pw.actual, passwordNuevo: pw.nuevo });
      setPwMsg({ ok: true, text: 'Contraseña actualizada correctamente.' });
      setPw({ actual: '', nuevo: '', confirmar: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al cambiar la contraseña.';
      setPwMsg({ ok: false, text: msg });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <motion.div className="min-h-screen bg-slate-900 flex flex-col" {...pageEnter}>
      <DashboardNavbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
        </div>

        {/* Avatar + resumen */}
        <div className="bg-slate-800 rounded-xl border border-white/10 p-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg">
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-white truncate">{user?.nombre}</h2>
              <p className="text-slate-400 text-sm mt-0.5">
                {ROLE_LABEL[user?.role] || user?.role}
                {company?.nombre ? ` · ${company.nombre}` : ''}
              </p>
              <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${PLAN_BADGE[plan]}`}>
                Plan {PLAN_LABEL[plan]}
              </span>
            </div>
          </div>
        </div>

        {/* Info de cuenta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <InfoChip icon={Shield} label="Rol" value={ROLE_LABEL[user?.role] || user?.role} />
          <InfoChip icon={Building2} label="Empresa" value={company?.nombre || '—'} />
          <InfoChip icon={CreditCard} label="Plan" value={PLAN_LABEL[plan]} />
        </div>

        {/* Información personal */}
        <div className="bg-slate-800 rounded-xl border border-white/10 p-6">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">
            Información personal
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Nombre completo</label>
              <div className="flex gap-2">
                <input
                  value={nombre}
                  onChange={(e) => { setNombre(e.target.value); setNombreMsg(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveNombre()}
                  placeholder="Tu nombre completo"
                  className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSaveNombre}
                  disabled={savingNombre || !nombre.trim() || nombre.trim() === user?.nombre}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {savingNombre ? 'Guardando…' : 'Guardar'}
                </motion.button>
              </div>
              {nombreMsg && (
                <p className={`text-xs mt-1.5 ${nombreMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                  {nombreMsg.text}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Email</label>
              <input
                value={user?.email || ''}
                disabled
                className="w-full bg-slate-900/50 border border-white/5 rounded-lg px-3 py-2 text-slate-500 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-slate-700 mt-1">El email no se puede modificar.</p>
            </div>
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className="bg-slate-800 rounded-xl border border-white/10 p-6">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-5">
            Cambiar contraseña
          </h3>
          <div className="space-y-3">
            <PwField
              label="Contraseña actual"
              value={pw.actual}
              onChange={(v) => { setPw((f) => ({ ...f, actual: v })); setPwMsg(null); }}
            />
            <PwField
              label="Nueva contraseña"
              value={pw.nuevo}
              onChange={(v) => { setPw((f) => ({ ...f, nuevo: v })); setPwMsg(null); }}
            />
            <PwField
              label="Confirmar nueva contraseña"
              value={pw.confirmar}
              onChange={(v) => { setPw((f) => ({ ...f, confirmar: v })); setPwMsg(null); }}
            />

            {pwMsg && (
              <p className={`text-xs ${pwMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {pwMsg.text}
              </p>
            )}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleChangePw}
              disabled={savingPw || !pw.actual || !pw.nuevo || !pw.confirmar}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors mt-1"
            >
              {savingPw ? 'Actualizando…' : 'Actualizar contraseña'}
            </motion.button>
          </div>
        </div>

        {/* Link plan */}
        <div className="text-center pb-4">
          <Link
            to="/dashboard/plan"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Gestionar suscripción y plan →
          </Link>
        </div>

      </main>
    </motion.div>
  );
}

function InfoChip({ icon: Icon, label, value }) {
  return (
    <div className="bg-slate-800 rounded-xl border border-white/10 px-4 py-3 flex items-center gap-3">
      <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-white font-medium truncate capitalize">{value}</p>
      </div>
    </div>
  );
}

function PwField({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1.5 block">{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
      />
    </div>
  );
}
