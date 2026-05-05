import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import AuthLayout from '../components/AuthLayout';

const AcceptInvite = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [inviteData, setInviteData] = useState(null);
  const [form, setForm]             = useState({ nombre: '', password: '' });
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  // Validar el token al montar el componente
  useEffect(() => {
    if (!token) { setError(t('invite.invalid')); setLoading(false); return; }
    api.get(`/invitations/validate?token=${token}`)
      .then((res) => { setInviteData(res.data.data); setLoading(false); })
      .catch((err) => {
        setError(err.response?.data?.message || t('invite.invalid'));
        setLoading(false);
      });
  }, [token, t]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/invitations/accept', { token, ...form });
      const { token: jwt, user, company } = res.data.data;
      // Persistir sesión reutilizando la lógica del authSlice
      sessionStorage.setItem('taricai_token', jwt);
      sessionStorage.setItem('taricai_user', JSON.stringify(user));
      sessionStorage.setItem('taricai_company', JSON.stringify(company));
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthLayout>
        <div className="auth-card text-center text-gray-500 text-sm">{t('common.loading')}</div>
      </AuthLayout>
    );
  }

  if (error && !inviteData) {
    return (
      <AuthLayout>
        <div className="auth-card text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {t('invite.title', { empresa: inviteData?.empresa })}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {t('invite.subtitle', { rol: inviteData?.rolAsignado })}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">{t('invite.full_name')}</label>
            <input name="nombre" value={form.nombre} onChange={handleChange}
              className="input-field" placeholder="Tu nombre completo" required />
          </div>
          <div>
            <label className="form-label">{t('invite.password')}</label>
            <input name="password" type="password" value={form.password} onChange={handleChange}
              className="input-field" placeholder="••••••••" minLength={8} required />
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t('common.loading') : t('invite.submit')}
          </button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default AcceptInvite;
