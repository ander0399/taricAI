import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUsers, updateUserRole, deactivateUser,
  sendInvitation, clearTeamMessages,
} from '../store/slices/teamSlice';
import AppLayout from '../components/AppLayout';

const ROLE_LABELS = { owner: 'Propietario', admin: 'Admin', member: 'Miembro' };
const ROLE_COLORS = {
  owner:  'bg-amber-100 text-amber-800',
  admin:  'bg-purple-100 text-purple-800',
  member: 'bg-gray-100 text-gray-700',
};

const Toast = ({ message, type, onClose }) => (
  <div className={`fixed bottom-5 right-5 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50 ${
    type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
  }`}>
    {message}
    <button onClick={onClose} className="ml-2 opacity-75 hover:opacity-100">✕</button>
  </div>
);

const InviteModal = ({ onClose, onSubmit, loading }) => {
  const [email, setEmail]       = useState('');
  const [rol, setRol]           = useState('member');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email, rolAsignado: rol });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Invitar nuevo miembro</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Correo electrónico</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="input-field" placeholder="nombre@empresa.com" required />
          </div>
          <div>
            <label className="form-label">Rol asignado</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)} className="input-field">
              <option value="member">Miembro</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar invitación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 px-4">
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm text-center">
      <p className="text-gray-700 text-sm mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          Cancelar
        </button>
        <button onClick={onConfirm}
          className="flex-1 py-2.5 px-4 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700">
          Confirmar
        </button>
      </div>
    </div>
  </div>
);

const TeamManagement = () => {
  const dispatch = useDispatch();
  const { users, loading, actionError, actionSuccess } = useSelector((s) => s.team);
  const currentUser = useSelector((s) => s.auth.user);

  const [showInviteModal, setShowInviteModal]   = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(null); // userId
  const [inviteLoading, setInviteLoading]         = useState(false);

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  useEffect(() => {
    if (actionError || actionSuccess) {
      const timer = setTimeout(() => dispatch(clearTeamMessages()), 3500);
      return () => clearTimeout(timer);
    }
  }, [actionError, actionSuccess, dispatch]);

  const handleRoleChange = (userId, nuevoRol) => {
    dispatch(updateUserRole({ userId, nuevoRol }));
  };

  const handleDeactivate = (userId) => {
    setConfirmDeactivate(userId);
  };

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
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Equipo</h1>
          <p className="text-sm text-gray-400 mt-0.5">{users.length} miembro{users.length !== 1 ? 's' : ''} activo{users.length !== 1 ? 's' : ''}</p>
        </div>
        {['owner', 'admin'].includes(currentUser?.role) && (
          <button onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
            <span>+</span> Invitar miembro
          </button>
        )}
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Cargando equipo...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Nombre</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Rol</th>
                {currentUser?.role === 'owner' && <th className="text-right px-5 py-3">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => {
                const isCurrentUser = u.id === currentUser?.id;
                const isOwner       = u.role === 'owner';

                return (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">
                      {u.nombre}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-gray-400 font-normal">(tú)</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      {currentUser?.role === 'owner' && !isOwner && !isCurrentUser ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Miembro</option>
                        </select>
                      ) : (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role]}`}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      )}
                    </td>
                    {currentUser?.role === 'owner' && (
                      <td className="px-5 py-3.5 text-right">
                        {!isOwner && !isCurrentUser && (
                          <button
                            onClick={() => handleDeactivate(u.id)}
                            className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
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

      {/* Toast de feedback */}
      {actionSuccess && (
        <Toast message={actionSuccess} type="success" onClose={() => dispatch(clearTeamMessages())} />
      )}
      {actionError && (
        <Toast message={actionError} type="error" onClose={() => dispatch(clearTeamMessages())} />
      )}
    </AppLayout>
  );
};

export default TeamManagement;
