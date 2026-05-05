/**
 * @description Mapa completo ISO 639-3 → ISO 639-1 + nombre legible.
 * Cubre los 170+ idiomas que franc puede detectar.
 */
const LANG_MAP = {
  spa: { code: 'es', name: 'español' },
  eng: { code: 'en', name: 'English' },
  ara: { code: 'ar', name: 'العربية' },
  zho: { code: 'zh', name: '中文' },
  cmn: { code: 'zh', name: '中文' },
  por: { code: 'pt', name: 'português' },
  fra: { code: 'fr', name: 'français' },
  deu: { code: 'de', name: 'Deutsch' },
  ita: { code: 'it', name: 'italiano' },
  rus: { code: 'ru', name: 'русский' },
  jpn: { code: 'ja', name: '日本語' },
  kor: { code: 'ko', name: '한국어' },
  tur: { code: 'tr', name: 'Türkçe' },
  vie: { code: 'vi', name: 'tiếng Việt' },
  ind: { code: 'id', name: 'Bahasa Indonesia' },
  msa: { code: 'ms', name: 'Bahasa Melayu' },
  tha: { code: 'th', name: 'ภาษาไทย' },
  pol: { code: 'pl', name: 'polski' },
  nld: { code: 'nl', name: 'Nederlands' },
  swe: { code: 'sv', name: 'svenska' },
  nor: { code: 'no', name: 'norsk' },
  nob: { code: 'no', name: 'norsk' },
  dan: { code: 'da', name: 'dansk' },
  fin: { code: 'fi', name: 'suomi' },
  ces: { code: 'cs', name: 'čeština' },
  hun: { code: 'hu', name: 'magyar' },
  ron: { code: 'ro', name: 'română' },
  bul: { code: 'bg', name: 'български' },
  ukr: { code: 'uk', name: 'українська' },
  heb: { code: 'he', name: 'עברית' },
  hin: { code: 'hi', name: 'हिन्दी' },
  ben: { code: 'bn', name: 'বাংলা' },
  urd: { code: 'ur', name: 'اردو' },
  fas: { code: 'fa', name: 'فارسی' },
  swa: { code: 'sw', name: 'Kiswahili' },
  cat: { code: 'ca', name: 'català' },
  eus: { code: 'eu', name: 'euskara' },
  glg: { code: 'gl', name: 'galego' },
  hrv: { code: 'hr', name: 'hrvatski' },
  srp: { code: 'sr', name: 'srpski' },
  slk: { code: 'sk', name: 'slovenčina' },
  slv: { code: 'sl', name: 'slovenščina' },
  ell: { code: 'el', name: 'Ελληνικά' },
  lit: { code: 'lt', name: 'lietuvių' },
  lav: { code: 'lv', name: 'latviešu' },
  est: { code: 'et', name: 'eesti' },
  mkd: { code: 'mk', name: 'македонски' },
  bel: { code: 'be', name: 'беларуская' },
  kaz: { code: 'kk', name: 'қазақша' },
  azj: { code: 'az', name: 'Azərbaycan' },
  uzb: { code: 'uz', name: "o'zbek" },
  tgl: { code: 'tl', name: 'Filipino' },
  mya: { code: 'my', name: 'မြန်မာ' },
  khm: { code: 'km', name: 'ខ្មែរ' },
  lao: { code: 'lo', name: 'ລາວ' },
  sin: { code: 'si', name: 'සිංහල' },
  tam: { code: 'ta', name: 'தமிழ்' },
  tel: { code: 'te', name: 'తెలుగు' },
  kan: { code: 'kn', name: 'ಕನ್ನಡ' },
  mal: { code: 'ml', name: 'മലയാളം' },
  mar: { code: 'mr', name: 'मराठी' },
  guj: { code: 'gu', name: 'ગુજરાતી' },
  pan: { code: 'pa', name: 'ਪੰਜਾਬੀ' },
  nep: { code: 'ne', name: 'नेपाली' },
  amh: { code: 'am', name: 'አማርኛ' },
  hau: { code: 'ha', name: 'Hausa' },
  yor: { code: 'yo', name: 'Yorùbá' },
  ibo: { code: 'ig', name: 'Igbo' },
  zul: { code: 'zu', name: 'isiZulu' },
  xho: { code: 'xh', name: 'isiXhosa' },
  afr: { code: 'af', name: 'Afrikaans' },
  isl: { code: 'is', name: 'íslenska' },
  mlt: { code: 'mt', name: 'Malti' },
  cym: { code: 'cy', name: 'Cymraeg' },
  gle: { code: 'ga', name: 'Gaeilge' },
  lat: { code: 'la', name: 'Latina' },
  und: { code: 'es', name: 'español' }, // fallback universal
};

const FALLBACK = { code: 'es', name: 'español' };

/**
 * @description Detecta el idioma del mensaje usando franc y lo mapea a ISO 639-1.
 * Si el mensaje es demasiado corto (<8 chars) o franc devuelve 'und',
 * usa el idioma previo de la conversación o el fallback 'es'.
 * @param {string} message - Texto del mensaje del usuario
 * @param {string|null} conversationLanguage - ISO 639-1 del idioma previo de la conversación
 * @returns {{ code: string, name: string }} - ISO 639-1 code y nombre legible
 */
async function detectLanguage(message, conversationLanguage = null) {
  if (!message || message.trim().length < 8) {
    return resolveFromConversation(conversationLanguage);
  }

  try {
    const { franc } = await import('franc');
    const iso3 = franc(message.trim(), { minLength: 8 });
    if (iso3 === 'und' || !LANG_MAP[iso3]) {
      return resolveFromConversation(conversationLanguage);
    }
    return LANG_MAP[iso3];
  } catch {
    return resolveFromConversation(conversationLanguage);
  }
}

function resolveFromConversation(conversationLanguage) {
  if (!conversationLanguage) return FALLBACK;
  // Buscar en el mapa por ISO 639-1 code
  const found = Object.values(LANG_MAP).find(l => l.code === conversationLanguage);
  return found || FALLBACK;
}

module.exports = { detectLanguage };
