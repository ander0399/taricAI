import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

const SOURCES = [
  { abbr: 'WCO',      full: 'Organización Mundial de Aduanas' },
  { abbr: 'TARIC-EU', full: 'European Commission — Sistema Integrado de la UE' },
  { abbr: 'CBP/HTS',  full: 'U.S. Customs and Border Protection' },
  { abbr: 'VUCE',     full: 'Ventanilla Única de Comercio Exterior' },
  { abbr: 'ALADI',    full: 'Asociación Latinoamericana de Integración' },
  { abbr: 'UNCTAD',   full: 'Conferencia de las NN.UU. sobre Comercio y Desarrollo' },
  { abbr: 'WTO/OMC',  full: 'Organización Mundial del Comercio' },
];

/**
 * @description Carrusel infinito (autoplay) de fuentes oficiales verificadas con Swiper.js.
 * @returns {JSX.Element}
 */
export default function SourcesCarousel() {
  return (
    <section id="fuentes" className="py-16 px-4 bg-slate-900 overflow-hidden">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl font-bold text-white">
            Información verificada desde las fuentes oficiales más importantes del mundo
          </h2>
        </motion.div>

        <Swiper
          modules={[Autoplay]}
          spaceBetween={16}
          slidesPerView={2}
          breakpoints={{
            640:  { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          autoplay={{ delay: 2200, disableOnInteraction: false }}
          loop
        >
          {SOURCES.map(({ abbr, full }) => (
            <SwiperSlide key={abbr}>
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 flex flex-col items-center text-center gap-2 h-full">
                {/* Placeholder de logo */}
                <div className="w-12 h-12 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center">
                  <span className="text-blue-400 text-xs font-bold">{abbr.slice(0, 2)}</span>
                </div>
                <p className="text-white font-bold text-sm">{abbr}</p>
                <p className="text-slate-400 text-xs leading-snug">{full}</p>
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold mt-auto">
                  <ShieldCheck size={12} />
                  Fuente Oficial
                </span>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
