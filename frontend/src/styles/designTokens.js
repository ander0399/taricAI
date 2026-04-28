/**
 * @description Tokens de diseño centralizados para uso en código JS/JSX.
 *              Usar cuando Tailwind puro no alcanza: react-select, recharts,
 *              canvas, estilos inline dinámicos. Toda la plataforma usa estos
 *              valores — no introducir colores fuera de este sistema.
 */

export const colors = {
  bg: {
    root:    '#020617',             // slate-950 — body, footer, fondo más profundo
    page:    '#0f172a',             // slate-900 — páginas, dashboard, módulos
    card:    '#1e293b',             // slate-800 — cards, inputs, paneles
    hover:   '#334155',             // slate-700 — hover en interactivos, dropdowns
    overlay: 'rgba(2, 6, 23, 0.8)', // slate-950/80 — backdrop de modales
  },
  border: {
    standard: '#334155',                    // slate-700
    subtle:   'rgba(255, 255, 255, 0.1)',   // white/10
    accent:   'rgba(59, 130, 246, 0.4)',    // blue-500/40
    success:  'rgba(16, 185, 129, 0.4)',    // emerald-500/40
    danger:   'rgba(239, 68, 68, 0.4)',     // red-500/40
  },
  text: {
    primary:   '#ffffff',
    secondary: '#cbd5e1', // slate-300
    muted:     '#94a3b8', // slate-400
    faint:     '#64748b', // slate-500
    blue:      '#60a5fa', // blue-400
    emerald:   '#34d399', // emerald-400
    yellow:    '#facc15', // yellow-400
    red:       '#f87171', // red-400
  },
  brand: {
    primary:      '#2563eb', // blue-600
    primaryHover: '#3b82f6', // blue-500
    success:      '#059669', // emerald-600
    successHover: '#10b981', // emerald-500
  },
};

/**
 * @description Tema de estilos para react-select compatible con el sistema de diseño oscuro.
 *              Usar en CountrySelector, PlanSelector y cualquier componente react-select.
 * @param {object} base  - Estilos base del componente (provistos por react-select)
 * @param {object} state - Estado del componente (isFocused, isSelected, etc.)
 */
export const reactSelectTheme = {
  control: (base, state) => ({
    ...base,
    backgroundColor: colors.bg.card,
    borderColor: state.isFocused ? colors.brand.primary : colors.border.standard,
    boxShadow: state.isFocused ? `0 0 0 1px ${colors.brand.primary}` : 'none',
    '&:hover': { borderColor: colors.brand.primary },
    borderRadius: '0.75rem',
    padding: '2px 4px',
  }),
  menu: (base) => ({
    ...base,
    backgroundColor: colors.bg.card,
    border: `1px solid ${colors.border.standard}`,
    borderRadius: '0.75rem',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected
      ? colors.brand.primary
      : state.isFocused
        ? colors.bg.hover
        : 'transparent',
    color: colors.text.primary,
  }),
  singleValue:  (base) => ({ ...base, color: colors.text.primary }),
  input:        (base) => ({ ...base, color: colors.text.primary }),
  placeholder:  (base) => ({ ...base, color: colors.text.faint }),
};
