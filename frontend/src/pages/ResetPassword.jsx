import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import AuthLayout from '../components/AuthLayout';

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  if (!token) {
    return (
      <AuthLayout>
        <div className="auth-card text-center">
          <p className="text-red-600 text-sm">{t('reset.invalid_token')}</p>
          <Link to="/login" className="mt-4 inline-block text-primary-600 hover:underline text-sm">
            {t('common.back_to_login')}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, nuevaPassword: password });
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || t('reset.invalid_token'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('reset.title')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('reset.subtitle')}</p>

        {success ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
            {t('reset.success')}
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">{t('reset.new_password')}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-field" placeholder={t('reset.new_password_placeholder')}
                  minLength={8} required />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? t('common.loading') : t('reset.submit')}
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
