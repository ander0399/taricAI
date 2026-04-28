import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { useCountries } from '../../hooks/useCountries';

/** Convierte ISO alpha-2 → emoji de bandera Unicode */
const toFlag = (iso2) =>
  [...(iso2 || '').toUpperCase()].map((c) =>
    String.fromCodePoint(0x1F1E0 + c.charCodeAt(0) - 65)
  ).join('');

/**
 * @description Combobox de búsqueda para seleccionar un país.
 * Muestra bandera emoji + nombre en español + código ISO.
 * La conversión ISO-2 → ISO-3 ocurre en el componente padre antes de llamar al backend.
 * @param {{ label: string, value: object|null, onChange: Function, countries: Array, placeholder?: string }} props
 */
function CountryCombobox({ label, value, onChange, countries, placeholder = 'Buscar país...' }) {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState('');
  const containerRef        = useRef(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e) => { if (!containerRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? countries.filter((c) =>
        c.es.toLowerCase().includes(query.toLowerCase()) ||
        c.iso3.toLowerCase().includes(query.toLowerCase()) ||
        c.iso2.toLowerCase().includes(query.toLowerCase())
      )
    : countries;

  const handleSelect = (country) => {
    onChange(country);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="text-sm font-medium text-slate-400">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between bg-slate-800 border border-slate-600 focus:border-blue-500 rounded-xl px-4 py-3 text-left transition hover:border-blue-500/50"
      >
        {value ? (
          <span className="flex items-center gap-2 text-white text-sm">
            <span className="text-xl leading-none">{toFlag(value.iso2)}</span>
            <span>{value.es}</span>
            <span className="text-slate-500 text-xs">{value.iso2}</span>
          </span>
        ) : (
          <span className="text-slate-400 text-sm">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-40 w-full mt-1 bg-slate-800 border border-slate-600 rounded-xl overflow-hidden shadow-2xl"
            style={{ maxWidth: 'inherit' }}
          >
            {/* Búsqueda */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-700">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
              />
            </div>
            {/* Lista */}
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-slate-500 text-sm text-center">Sin resultados</li>
              ) : filtered.map((country) => (
                <li key={country.iso3}>
                  <button
                    type="button"
                    onClick={() => handleSelect(country)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 transition text-left"
                  >
                    <span className="text-xl leading-none">{toFlag(country.iso2)}</span>
                    <span className="text-white text-sm flex-1">{country.es}</span>
                    <span className="text-slate-500 text-xs font-mono">{country.iso2}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * @description Paso 5 — selección de país exportador e importador.
 * Convierte ISO-2 → ISO-3 antes de llamar a onSubmit (el backend trabaja con ISO alpha-3).
 * @param {{ onSubmit: Function, loading: boolean }} props
 */
export default function CountrySelector({ onSubmit, loading }) {
  const { countries, loading: countriesLoading } = useCountries();
  const [exporter, setExporter] = useState(null);
  const [importer, setImporter] = useState(null);
  const canSubmit = exporter && importer && !loading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // Pasar ISO-3 al backend
    onSubmit(exporter.iso3, importer.iso3);
  };

  if (countriesLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3">
        <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
        <span className="text-slate-400">Cargando países...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-2xl font-bold text-white mb-1">¿Entre qué países se mueve tu mercancía?</h2>
        <p className="text-slate-400 text-sm">Selecciona el país exportador y el país importador</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        <div className="relative">
          <CountryCombobox
            label="País exportador (quien envía)"
            value={exporter}
            onChange={setExporter}
            countries={countries}
            placeholder="Seleccionar exportador..."
          />
        </div>
        <div className="relative">
          <CountryCombobox
            label="País importador (quien recibe)"
            value={importer}
            onChange={setImporter}
            countries={countries}
            placeholder="Seleccionar importador..."
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full rounded-lg py-3 font-bold text-lg text-white transition ${
          canSubmit
            ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'
            : 'bg-slate-700 opacity-50 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Consultando fuentes oficiales...
          </span>
        ) : (
          '🚀 Investigar aranceles'
        )}
      </button>
    </div>
  );
}
