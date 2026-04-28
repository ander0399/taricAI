import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PlanCard from '../components/PlanCard';
import StripeBuyButton from '../components/StripeBuyButton';
import EnterpriseContactModal from '../components/EnterpriseContactModal';

const FREE_FEATURES = [
  '5 clasificaciones arancelarias / mes',
  '1 usuario — sin invitar miembros',
  'Clasificación básica por IA',
  'Sin tarjeta requerida',
];

const PRO_FEATURES = [
  '50 clasificaciones arancelarias / mes',
  '1 usuario',
  'Scoring de confianza arancelario',
  'Alertas de riesgo regulatorio',
  'Módulo de Barreras No Arancelarias',
  'OCR básico: carga de facturas por IA',
];

const TEAM_FEATURES = [
  'Hasta 15 usuarios activos (per-seat)',
  '2,000 clasificaciones compartidas / mes',
  'Todo el Plan Pro incluido',
  'Panel de administración de usuarios',
  'Clasificaciones compartidas entre miembros',
  'Soporte por correo prioritario',
];

const ENTERPRISE_FEATURES = [
  'Usuarios ilimitados',
  'Clasificaciones ilimitadas',
  'API Dedicada — integración ERP/TMS',
  'Servidor Privado (Self-Hosted)',
  'Inteligencia Geopolítica en tiempo real',
  'Soporte 24/7 con consultor senior asignado',
  'Capacitación técnica del equipo',
  'SLA personalizado',
];

/**
 * @description Sección de planes y precios con 4 tarjetas y lógica de botones diferenciada.
 *              Free → /register | Pro y Team → StripeBuyButton | Enterprise → modal de contacto.
 * @returns {JSX.Element}
 */
export default function PricingPlans() {
  const [enterpriseOpen, setEnterpriseOpen] = useState(false);

  return (
    <section id="planes" className="py-20 px-4 bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white">Planes y Precios</h2>
          <p className="text-slate-400 mt-3 text-sm max-w-xl mx-auto">
            Desde exploración individual hasta corporativo a medida. Sin contratos, sin penalizaciones.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Plan Free */}
          <PlanCard
            delay={0}
            name="Free"
            price="$0"
            description="Exploración individual sin compromiso"
            features={FREE_FEATURES}
            cta={
              <Link
                to="/register"
                className="block w-full text-center bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2.5 font-medium text-sm transition"
              >
                Comenzar Gratis
              </Link>
            }
          />

          {/* Plan Pro */}
          <PlanCard
            delay={0.1}
            name="Pro"
            price="$49/mes"
            description="Profesional individual con mayor capacidad"
            features={PRO_FEATURES}
            highlighted
            badgeLabel="MÁS POPULAR"
            cta={
              <StripeBuyButton
                planId="pro"
                label="Adquirir Plan Pro"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 font-bold shadow-lg shadow-blue-500/30 text-sm transition"
              />
            }
          />

          {/* Plan Team */}
          <PlanCard
            delay={0.2}
            name="Team"
            price="$29/seat/mes"
            description="Equipos y empresas con facturación per-seat"
            features={TEAM_FEATURES}
            cta={
              <StripeBuyButton
                planId="team"
                label="Adquirir Plan Team"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2.5 font-bold text-sm transition"
              />
            }
          />

          {/* Plan Enterprise */}
          <PlanCard
            delay={0.3}
            name="Enterprise"
            price="Custom"
            description="Corporativo a medida con negociación directa"
            features={ENTERPRISE_FEATURES}
            cta={
              <button
                onClick={() => setEnterpriseOpen(true)}
                className="w-full bg-slate-800 border border-slate-600 hover:bg-slate-700 text-white rounded-lg py-2.5 font-bold text-sm transition"
              >
                Contactar con Ventas
              </button>
            }
          />
        </div>
      </div>

      <EnterpriseContactModal
        isOpen={enterpriseOpen}
        onClose={() => setEnterpriseOpen(false)}
      />
    </section>
  );
}
