import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const current = i18n.language?.startsWith('en') ? 'en' : 'es';

  return (
    <div className="flex gap-2 text-xs font-medium">
      {['es', 'en'].map((lang) => (
        <button
          key={lang}
          onClick={() => i18n.changeLanguage(lang)}
          className={`uppercase px-2 py-1 rounded transition-colors ${
            current === lang
              ? 'bg-primary-600 text-white'
              : 'text-gray-500 hover:text-primary-600'
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
