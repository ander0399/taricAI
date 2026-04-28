import Navbar            from '../sections/Navbar';
import HeroBanner        from '../sections/HeroBanner';
import TrustIndicators   from '../sections/TrustIndicators';
import ProblemsSolutions from '../sections/ProblemsSolutions';
import PricingPlans      from '../sections/PricingPlans';
import SourcesCarousel   from '../sections/SourcesCarousel';
import FAQAccordion      from '../sections/FAQAccordion';
import Footer            from '../sections/Footer';

/**
 * @description Página principal pública — funnel de conversión de Taric AI.
 *              Compone todas las secciones de la landing en orden lógico de conversión.
 * @returns {JSX.Element}
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      <main>
        <HeroBanner />
        <TrustIndicators />
        <ProblemsSolutions />
        <PricingPlans />
        <SourcesCarousel />
        <FAQAccordion />
      </main>
      <Footer />
    </div>
  );
}
