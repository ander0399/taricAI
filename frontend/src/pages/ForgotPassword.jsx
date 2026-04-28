import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import AuthLayout from '../components/AuthLayout';

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('forgot.title')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('forgot.subtitle')}</p>

        {sent ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
            {t('forgot.success')}
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
                <label className="form-label">{t('forgot.email')}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-field" placeholder="ana@empresa.com" required />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? t('common.loading') : t('forgot.submit')}
              </button>
            </form>
          </>
        )}

        <p className="mt-5 text-center text-sm">
          <Link to="/login" className="text-primary-600 hover:underline">{t('common.back_to_login')}</Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
