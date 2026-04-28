import { Globe, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const COLS = [
  {
    title: 'Soluciones',
    links: [
      { label: 'Plan Free',        href: '#planes' },
      { label: 'Plan Pro',         href: '#planes' },
      { label: 'Plan Team',        href: '#planes' },
      { label: 'Plan Enterprise',  href: '#planes' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Términos de Servicio', href: '#' },
      { label: 'Privacidad',           href: '#' },
      { label: 'Cookies',              href: '#' },
      { label: 'SLA',                  href: '#' },
    ],
  },
  {
    title: 'Soporte',
    links: [
      { label: 'Centro de Ayuda',      href: '#' },
      { label: 'soporte@taricai.com',  href: 'mailto:soporte@taricai.com' },
      { label: 'Estado del sistema',   href: '#' },
    ],
  },
];

/**
 * @description Footer profesional de 4 columnas con disclaimer legal.
 * @returns {JSX.Element}
 */
export default function Footer() {
  return (
    <footer id="contacto" className="bg-slate-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Columna 1 — Marca */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe size={20} className="text-blue-400" />
              <span className="font-bold text-white text-lg">Taric AI</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Plataforma de inteligencia arancelaria para equipos de comercio exterior.
            </p>
            <div className="flex items-center gap-1.5 mt-4">
              <Lock size={13} className="text-emerald-400" />
              <span className="text-xs text-slate-500">SSL / TLS Cifrado</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              © {new Date().getFullYear()} Taric AI S.A. Todos los derechos reservados.
            </p>
          </div>

          {/* Columnas dinámicas */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold text-sm mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-slate-400 hover:text-white text-sm transition"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Disclaimer legal */}
        <div className="mt-10 pt-6 border-t border-white/5">
          <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
            Taric AI es una plataforma de asistencia tecnológica basada en modelos de lenguaje y datos oficiales.
            Los resultados no constituyen un dictamen legal vinculante. El usuario es responsable final de la
            declaración ante las autoridades aduaneras. Su interpretación debe ser supervisada por profesionales
            del sector aduanero.
          </p>
        </div>
      </div>
    </footer>
  );
}
