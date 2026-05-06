import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  fetchAllCountries,
  fetchCountryBasic,
  fetchCountryPro,
  trackMapInteraction,
} from '../services/riskMap.api';

const initialFilters = { region: 'all', riskLevel: 'all', trend: 'all' };

// Persistencia de sesión: el mapa no pierde estado al navegar y volver al dashboard
const SESSION_KEY = 'taricai_riskmap_state';
const loadSession = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};
const saveSession = (patch) => {
  try {
    const prev = loadSession();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...prev, ...patch }));
  } catch {}
};

/**
 * @description Hook central del módulo Mapa de Riesgo País.
 * Gestiona: carga de perfiles, selección de país, filtros del mapa, analytics y
 * auto-selección inteligente desde la última clasificación del clasificador.
 *
 * @returns {{
 *   countries:        Array,
 *   filteredCountries: Array,
 *   selectedIso:      string|null,
 *   countryDetail:    Object|null,
 *   alerts:           Array,
 *   lastUpdate:       string|null,
 *   nextUpdate:       string|null,
 *   loading:          { countries: boolean, countryDetail: boolean },
 *   error:            { countries: string|null, countryDetail: string|null },
 *   filters:          { region: string, riskLevel: string, trend: string },
 *   userPlan:         string,
 *   fetchAllCountries: () => Promise<void>,
 *   selectCountry:    (iso: string) => Promise<void>,
 *   clearSelection:   () => void,
 *   applyFilter:      (type: string, value: string) => void,
 *   resetFilters:     () => void,
 *   trackInteraction: (iso: string, action: string) => void,
 * }}
 */
const useRiskMap = () => {
  const { company }       = useSelector((s) => s.auth);
  const classifierResult  = useSelector((s) => s.classifier.result);
  const userPlan          = company?.plan || 'free';

  // Restaurar selectedIso y filters desde sessionStorage al montar
  const session = loadSession();

  const [countries,      setCountries]      = useState([]);
  const [selectedIso,    setSelectedIso]    = useState(session.selectedIso || null);
  const [countryDetail,  setCountryDetail]  = useState(null);
  const [alerts,         setAlerts]         = useState([]);
  const [lastUpdate,     setLastUpdate]     = useState(null);
  const [nextUpdate,     setNextUpdate]     = useState(null);
  const [filters,        setFilters]        = useState(session.filters || initialFilters);
  const [loading,        setLoading]        = useState({ countries: false, countryDetail: false });
  const [error,          setError]          = useState({ countries: null, countryDetail: null });

  // Persistir selectedIso y filters en sessionStorage al cambiar
  useEffect(() => { saveSession({ selectedIso }); }, [selectedIso]);
  useEffect(() => { saveSession({ filters }); }, [filters]);

  // ── filteredCountries: derivado de countries + filters, sin llamada al backend ──
  const filteredCountries = useMemo(() => {
    if (!countries.length) return [];
    return countries.filter((c) => {
      if (filters.region    !== 'all' && c.region    !== filters.region)    return false;
      if (filters.riskLevel !== 'all' && c.riskLevel !== filters.riskLevel) return false;
      if (filters.trend     !== 'all' && c.trend     !== filters.trend)     return false;
      return true;
    });
  }, [countries, filters]);

  // ── Fetch de todos los países ────────────────────────────────────────────────

  /**
   * @description Carga todos los perfiles mínimos para colorear el mapa.
   * Se llama una sola vez al montar RiskMapSection — no en cada render.
   * @returns {Promise<void>}
   */
  const loadAllCountries = useCallback(async () => {
    setLoading((prev) => ({ ...prev, countries: true }));
    setError((prev) => ({ ...prev, countries: null }));
    try {
      const result = await fetchAllCountries();
      setCountries(result.data || []);
      setAlerts((result.data || []).filter((c) => c.riskLevel === 'critical' || c.trend === 'deteriorating'));
      setLastUpdate(result.lastGlobalUpdate || null);
    } catch (err) {
      setError((prev) => ({
        ...prev,
        countries: err.response?.data?.message || 'No se pudo cargar el mapa.',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, countries: false }));
    }
  }, []);

  // ── Selección de país ────────────────────────────────────────────────────────

  /**
   * @description Carga el detalle de un país al hacer click en el mapa.
   * Usa el endpoint /pro si el usuario tiene plan >= pro, /country/:iso si no.
   * @param {string} isoAlpha3 - Código ISO alpha-3 del país clickeado
   * @returns {Promise<void>}
   */
  const selectCountry = useCallback(async (isoAlpha3) => {
    if (!isoAlpha3) return;
    setSelectedIso(isoAlpha3);
    setCountryDetail(null);
    setLoading((prev) => ({ ...prev, countryDetail: true }));
    setError((prev) => ({ ...prev, countryDetail: null }));

    try {
      const isPro = ['pro', 'team', 'enterprise'].includes(userPlan);
      const result = isPro
        ? await fetchCountryPro(isoAlpha3)
        : await fetchCountryBasic(isoAlpha3);
      setCountryDetail(result.data);
    } catch (err) {
      setError((prev) => ({
        ...prev,
        countryDetail: err.response?.data?.message || 'No se pudo cargar el análisis.',
      }));
    } finally {
      setLoading((prev) => ({ ...prev, countryDetail: false }));
    }
  }, [userPlan]);

  /**
   * @description Deselecciona el país activo y limpia el panel lateral.
   * @returns {void}
   */
  const clearSelection = useCallback(() => {
    setSelectedIso(null);
    setCountryDetail(null);
    setError((prev) => ({ ...prev, countryDetail: null }));
    saveSession({ selectedIso: null });
  }, []);

  // ── Filtros (sin llamada al backend) ────────────────────────────────────────

  /**
   * @description Aplica un filtro al estado local. Recalcula filteredCountries.
   * @param {'region'|'riskLevel'|'trend'} filterType
   * @param {string} value - Valor del filtro ('all' para quitar el filtro)
   * @returns {void}
   */
  const applyFilter = useCallback((filterType, value) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
    trackMapInteraction('__filter__', 'filter');
  }, []);

  /**
   * @description Resetea todos los filtros a 'all'.
   * @returns {void}
   */
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  // ── Analytics (fire-and-forget) ──────────────────────────────────────────────

  /**
   * @description Registra una interacción intencional del usuario.
   * @param {string} isoAlpha3
   * @param {'click'|'filter'|'export'|'pin'} actionType
   * @returns {void}
   */
  const trackInteraction = useCallback((isoAlpha3, actionType) => {
    if (isoAlpha3 && isoAlpha3 !== '__filter__') {
      trackMapInteraction(isoAlpha3, actionType);
    }
  }, []);

  // ── Auto-selección desde el clasificador ────────────────────────────────────
  // Si el clasificador completó una clasificación en esta sesión y tiene país de origen,
  // auto-seleccionarlo en el mapa al montar el componente.

  /**
   * @description Auto-selecciona el país exportador de la última clasificación si existe.
   * Usa state.classifier.result (sesión activa) — se limpia al cerrar el navegador.
   * @returns {void}
   */
  const autoSelectFromClassifier = useCallback(() => {
    // originCountry = país exportador en el registro de Classifications (ISO-3)
    const iso = classifierResult?.originCountry || classifierResult?.destCountry;
    if (iso && iso.length === 3) {
      selectCountry(iso);
    }
  }, [classifierResult, selectCountry]);

  // Carga inicial al montar el hook
  useEffect(() => {
    loadAllCountries();
  }, [loadAllCountries]);

  // Si se restauró selectedIso desde sessionStorage, recargar el detalle del país
  useEffect(() => {
    if (session.selectedIso && countries.length > 0 && !countryDetail && !loading.countryDetail) {
      selectCountry(session.selectedIso);
    }
  // Solo cuando countries se carga por primera vez
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries.length]);

  // Auto-selección: se ejecuta cuando countries ya están cargados y hay resultado de clasificación
  useEffect(() => {
    if (countries.length > 0 && classifierResult && !selectedIso) {
      autoSelectFromClassifier();
    }
  // Solo al cargar países por primera vez — no re-ejecutar en cada cambio de classifierResult
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries.length]);

  return {
    countries,
    filteredCountries,
    selectedIso,
    countryDetail,
    alerts,
    lastUpdate,
    nextUpdate,
    loading,
    error,
    filters,
    userPlan,
    fetchAllCountries:  loadAllCountries,
    selectCountry,
    clearSelection,
    applyFilter,
    resetFilters,
    trackInteraction,
  };
};

export default useRiskMap;
