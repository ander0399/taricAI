import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { UserPlus, Users } from 'lucide-react';
import {
  fetchUsers, updateUserRole, deactivateUser,
  sendInvitation, clearTeamMessages,
} from '../store/slices/teamSlice';
import DashboardNavbar from '../components/layout/DashboardNavbar';
import { pageEnter } from '../styles/animations';

const ROLE_LABELS = { owner: 'Propietario', admin: 'Admin', member: 'Miembro' };

const ROLE_BADGE = {
  owner:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  admin:  'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  member: 'bg-slate-700 text-slate-300 border border-slate-600',
};

/* ── Toast ─────────────────────────────────────────────────────────────────── */
const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 ${
    type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
  }`}>
    {message}
    <button onClick={onClose} className="ml-2 opacity-75 hover:opacity-100">✕</button>
  </div>
);

/* ── Modal invitar miembro ──────────────────────────────────────────────────── */
const InviteModal = ({ onClose, onSubmit, loading }) => {
  const [email, setEmail] = useState('');
  const [rol, setRol]     = useState('member');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, rolAsignado: rol });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800 border border-white/10 rounded-2xl shadow-xl p-6 w-full max-w-md"
      >
        <h2 className="text-lg font-bold text-white mb-4">Invitar nuevo miembro</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              required
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Rol asignado
            </label>
            <select
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="member">Miembro</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-white/10 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

/* ── Modal confirmar desactivación ─────────────────────────────────────────── */
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40 px-4">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-800 border border-white/10 rounded-2xl shadow-xl p-6 w-full max-w-sm text-center"
    >
      <p className="text-slate-300 text-sm mb-6">{message}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 border border-white/10 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 transition"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
        >
          Confirmar
        </button>
      </div>
    </motion.div>
  </div>
);

/* ── Página principal ───────────────────────────────────────────────────────── */
const TeamManagement = () => {
  const dispatch    = useDispatch();
  const { users, loading, actionError, actionSuccess } = useSelector((s) => s.team);
  const currentUser = useSelector((s) => s.auth.user);

  const [showInviteModal, setShowInviteModal]     = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null);
  const [inviteLoading, setInviteLoading]         = useState(false);

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  useEffect(() => {
    if (actionError || actionSuccess) {
      const timer = setTimeout(() => dispatch(clearTeamMessages()), 3500);
      return () => clearTimeout(timer);
    }
  }, [actionError, actionSuccess, dispatch]);

  const handleRoleChange = (userId, nuevoRol) => dispatch(updateUserRole({ userId, nuevoRol }));

  const confirmDeactivateUser = () => {
    dispatch(deactivateUser(confirmDeactivate));
    setConfirmDeactivate(null);
  };

  const handleInvite = async ({ email, rolAsignado }) => {
    setInviteLoading(true);
    const result = await dispatch(sendInvitation({ email, rolAsignado }));
    setInviteLoading(false);
    if (sendInvitation.fulfilled.match(result)) setShowInviteModal(false);
  };

  return (
    <motion.div className="min-h-screen bg-slate-900 flex flex-col" {...pageEnter}>
      <DashboardNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Gestión de Equipo</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {users.length} miembro{users.length !== 1 ? 's' : ''} activo{users.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {['owner', 'admin'].includes(currentUser?.role) && (
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invitar miembro
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="bg-slate-800 rounded-xl border border-white/10 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Cargando equipo...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <th className="text-left px-5 py-3">Nombre</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Rol</th>
                  {currentUser?.role === 'owner' && (
                    <th className="text-right px-5 py-3">Acciones</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => {
                  const isCurrentUser = u.id === currentUser?.id;
                  const isOwner       = u.role === 'owner';

                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-white">
                        {u.nombre}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-slate-500 font-normal">(tú)</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{u.email}</td>
                      <td className="px-5 py-3.5">
                        {currentUser?.role === 'owner' && !isOwner && !isCurrentUser ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="text-xs bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Miembro</option>
                          </select>
                        ) : (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_BADGE[u.role]}`}>
                            {ROLE_LABELS[u.role]}
                          </span>
                        )}
                      </td>
                      {currentUser?.role === 'owner' && (
                        <td className="px-5 py-3.5 text-right">
                          {!isOwner && !isCurrentUser && (
                            <button
                              onClick={() => setConfirmDeactivate(u.id)}
                              className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                            >
                              Desactivar
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modales */}
      {showInviteModal && (
        <InviteModal
          loading={inviteLoading}
          onClose={() => setShowInviteModal(false)}
          onSubmit={handleInvite}
        />
      )}
      {confirmDeactivate && (
        <ConfirmModal
          message="¿Estás seguro de que deseas desactivar este usuario? Perderá acceso inmediatamente."
          onConfirm={confirmDeactivateUser}
          onCancel={() => setConfirmDeactivate(null)}
        />
      )}

      {/* Toasts */}
      {actionSuccess && (
        <Toast message={actionSuccess} type="success" onClose={() => dispatch(clearTeamMessages())} />
      )}
      {actionError && (
        <Toast message={actionError} type="error" onClose={() => dispatch(clearTeamMessages())} />
      )}
    </motion.div>
  );
};

export default TeamManagement;
