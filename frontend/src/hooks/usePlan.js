import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentPlan } from '../services/subscription.api';

/** Límites por plan según la tabla maestra de precios */
const PLAN_LIMITS = {
  free:       5,
  pro:        50,
  team:       2000,
  enterprise: Infinity,
};

/** Features disponibles por plan */
const PLAN_FEATURES = {
  free:       ['text_classifier'],
  pro:        ['text_classifier', 'image_classifier', 'ocr', 'history', 'pdf_export'],
  team:       ['text_classifier', 'image_classifier', 'ocr', 'history', 'pdf_export', 'team_management', 'mirror_analysis'],
  enterprise: ['text_classifier', 'image_classifier', 'ocr', 'history', 'pdf_export', 'team_management', 'mirror_analysis', 'api_access', 'custom_integrations'],
};

/**
 * @description Hook para acceder al estado del plan activo del usuario.
 *              Consulta GET /api/subscription/current y cachea el resultado
 *              en estado local. Provee hasFeature() para verificar acceso a
 *              features sin lógica dispersa en los componentes.
 * @returns {{
 *   currentPlan:   string,
 *   usage:         { used: number, limit: number, percentage: number },
 *   renewalDate:   Date | null,
 *   stripeStatus:  string | null,
 *   cancelAtPeriodEnd: boolean,
 *   hasFeature:    (featureName: string) => boolean,
 *   isLoading:     boolean,
 *   error:         string | null,
 *   refetch:       () => void
 * }}
 */
const usePlan = () => {
  const { company, token } = useSelector((s) => s.auth);

  // Plan del store Redux como valor inicial para evitar flash de loading
  const [data, setData]       = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchPlan = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      setLoading(true);
      const result = await getCurrentPlan();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar el plan.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  // Usar datos del store como fallback mientras carga
  const plan        = data?.plan        ?? company?.plan ?? 'free';
  const usedCount   = data?.usage?.used ?? 0;
  const limit       = PLAN_LIMITS[plan] ?? 5;
  const percentage  = limit === Infinity ? 0 : Math.min(100, Math.round((usedCount / limit) * 100));

  /**
   * @description Verifica si el plan activo tiene acceso a una feature concreta.
   * @param {string} featureName - Nombre de la feature (ver PLAN_FEATURES)
   * @returns {boolean}
   */
  const hasFeature = (featureName) =>
    (PLAN_FEATURES[plan] ?? PLAN_FEATURES.free).includes(featureName);

  return {
    currentPlan:       plan,
    usage:             { used: usedCount, limit, percentage },
    renewalDate:       data?.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null,
    stripeStatus:      data?.stripeStatus ?? null,
    cancelAtPeriodEnd: data?.cancelAtPeriodEnd ?? false,
    hasFeature,
    isLoading,
    error,
    refetch: fetchPlan,
  };
};

export default usePlan;
