import { useState, useEffect, useMemo } from 'react';
import { fetchCountries } from '../services/classifier.api';

// Módulo-level cache para no re-fetchear en cada mount del componente
let cachedCountries = null;

/**
 * @description Hook para cargar, filtrar y convertir el listado de países.
 * Cachea el resultado del API en memoria para evitar llamadas repetidas.
 * Expone iso2ToIso3 para la conversión requerida antes de enviar al backend.
 * @returns {{ countries: Array, loading: boolean, search: string, setSearch: Function,
 *             filtered: Array, getIso3: Function, getCountry: Function }}
 */
export function useCountries() {
  const [countries, setCountries] = useState(cachedCountries || []);
  const [loading, setLoading]     = useState(!cachedCountries);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    if (cachedCountries) return;
    fetchCountries()
      .then((res) => {
        cachedCountries = res.data.data || [];
        setCountries(cachedCountries);
      })
      .catch(() => { setCountries([]); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return countries;
    const q = search.toLowerCase();
    return countries.filter(
      (c) => c.es.toLowerCase().includes(q) || c.en.toLowerCase().includes(q) || c.iso2.toLowerCase().includes(q) || c.iso3.toLowerCase().includes(q),
    );
  }, [countries, search]);

  /** Convierte ISO alpha-2 → ISO alpha-3 (para el backend) */
  const getIso3 = (iso2) => countries.find((c) => c.iso2 === iso2)?.iso3 || iso2;

  /** Obtiene el objeto país completo por ISO-3 */
  const getCountry = (iso3) => countries.find((c) => c.iso3 === iso3) || null;

  return { countries, loading, search, setSearch, filtered, getIso3, getCountry };
}
