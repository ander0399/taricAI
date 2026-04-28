/**
 * @description Variantes de Framer Motion reutilizables en toda la plataforma.
 *              Importar y aplicar directamente en motion.div/section/article.
 *              No crear variantes ad-hoc — usar o extender las definidas aquí.
 */

/** Entrada de página — fade + ligero desplazamiento vertical */
export const pageEnter = {
  initial:    { opacity: 0, y: 8 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

/**
 * Entrada de card con delay configurable para stagger de listas.
 * @param {number} delay - Segundos de retraso (default 0)
 */
export const cardEnter = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut', delay },
});

/** Transición entre pasos de un wizard — slide horizontal */
export const stepTransition = {
  initial:    { opacity: 0, x: 24 },
  animate:    { opacity: 1, x: 0 },
  exit:       { opacity: 0, x: -24 },
  transition: { duration: 0.25, ease: 'easeInOut' },
};

/** Entrada de modal — scale sutil para no distraer del contenido */
export const modalEnter = {
  initial:    { opacity: 0, scale: 0.96 },
  animate:    { opacity: 1, scale: 1 },
  exit:       { opacity: 0, scale: 0.96 },
  transition: { duration: 0.2, ease: 'easeOut' },
};

/** Panel lateral o menú mobile — entra desde la derecha */
export const slideInRight = {
  initial:    { x: '100%' },
  animate:    { x: 0 },
  exit:       { x: '100%' },
  transition: { duration: 0.3, ease: 'easeInOut' },
};

/** Animaciones exclusivas del módulo Chat de IA */
export const chatIAAnimations = {
  messageEnter: {
    initial:    { opacity: 0, y: 8, scale: 0.98 },
    animate:    { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  sidebarDrawer: {
    initial:    { x: '-100%' },
    animate:    { x: 0 },
    exit:       { x: '-100%' },
    transition: { duration: 0.28, ease: 'easeInOut' },
  },
  restrictionEnter: {
    initial:    { opacity: 0, scale: 0.97 },
    animate:    { opacity: 1, scale: 1 },
    transition: { duration: 0.18 },
  },
  /** @param {number} index - índice de la card para stagger */
  suggestionCard: (index) => ({
    initial:    { opacity: 0, y: 12 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.3, ease: 'easeOut', delay: index * 0.06 },
  }),
};
