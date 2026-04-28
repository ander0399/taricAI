import LanguageSwitcher from './LanguageSwitcher';

/**
 * Layout compartido para todas las pantallas de autenticación.
 * Centra el contenido y muestra el logo + selector de idioma.
 */
const AuthLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 to-gray-100">
    <div className="w-full max-w-md mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">T</span>
        </div>
        <span className="font-bold text-primary-900 text-lg">TaricAI</span>
      </div>
      <LanguageSwitcher />
    </div>
    {children}
  </div>
);

export default AuthLayout;
