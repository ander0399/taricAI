import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

// ── Colores TRS (paleta CESCE sobre fondo oscuro) ─────────────────────────────
const RISK_COLORS = {
  low:      '#22c55e',  // green-500
  medium:   '#eab308',  // yellow-500
  high:     '#f97316',  // orange-500
  critical: '#ef4444',  // red-500
  none:     '#334155',  // slate-700 — sin datos
};

// Mapeo de ISO numeric (TopoJSON) → ISO alpha-3 para colorear el mapa
// TopoJSON countries-110m usa códigos numéricos ISO 3166-1
const buildIsoNumericMap = (countries) => {
  // Este lookup se construye con los datos del backend
  const map = {};
  for (const c of countries) {
    if (c.isoAlpha3) map[c.isoAlpha3] = c;
  }
  return map;
};

// Tabla de conversión ISO numeric → alpha-3 (subset de los 139 países del proyecto)
const NUM_TO_ALPHA3 = {
  4:'AFG',8:'ALB',12:'DZA',24:'AGO',32:'ARG',36:'AUS',40:'AUT',31:'AZE',
  44:'BHS',48:'BHR',50:'BGD',52:'BRB',112:'BLR',56:'BEL',84:'BLZ',64:'BTN',
  68:'BOL',70:'BIH',72:'BWA',76:'BRA',100:'BGR',854:'BFA',108:'BDI',116:'KHM',
  120:'CMR',124:'CAN',132:'CPV',140:'CAF',144:'LKA',152:'CHL',156:'CHN',170:'COL',
  174:'COM',178:'COG',180:'COD',188:'CRI',191:'HRV',192:'CUB',196:'CYP',203:'CZE',
  204:'BEN',208:'DNK',262:'DJI',214:'DOM',218:'ECU',818:'EGY',222:'SLV',226:'GNQ',
  232:'ERI',233:'EST',231:'ETH',246:'FIN',250:'FRA',266:'GAB',288:'GHA',300:'GRC',
  320:'GTM',324:'GIN',328:'GUY',332:'HTI',340:'HND',348:'HUN',356:'IND',360:'IDN',
  364:'IRN',368:'IRQ',372:'IRL',376:'ISR',380:'ITA',388:'JAM',392:'JPN',400:'JOR',
  398:'KAZ',404:'KEN',408:'PRK',410:'KOR',414:'KWT',418:'LAO',422:'LBN',426:'LSO',
  430:'LBR',434:'LBY',440:'LTU',442:'LUX',450:'MDG',454:'MWI',458:'MYS',466:'MLI',
  484:'MEX',496:'MNG',504:'MAR',508:'MOZ',516:'NAM',524:'NPL',528:'NLD',540:'NCL',
  558:'NIC',562:'NER',566:'NGA',578:'NOR',586:'PAK',591:'PAN',598:'PNG',600:'PRY',
  604:'PER',608:'PHL',616:'POL',620:'PRT',630:'PRI',634:'QAT',642:'ROU',643:'RUS',
  646:'RWA',682:'SAU',686:'SEN',694:'SLE',703:'SVK',705:'SVN',706:'SOM',710:'ZAF',
  716:'ZWE',724:'ESP',740:'SUR',752:'SWE',756:'CHE',760:'SYR',762:'TJK',764:'THA',
  768:'TGO',780:'TTO',788:'TUN',792:'TUR',800:'UGA',804:'UKR',784:'ARE',840:'USA',
  858:'URY',860:'UZB',862:'VEN',704:'VNM',887:'YEM',894:'ZMB',688:'SRB',756:'CHE',
  191:'HRV',807:'MKD',499:'MNE',70:'BIH',8:'ALB',688:'SRB',388:'JAM',332:'HTI',
  659:'KNA',662:'LCA',670:'VCT',533:'ABW',630:'PRI',388:'JAM',
  // Extra comunes
  702:'SGP',158:'TWN',446:'MAC',344:'HKG',352:'ISL',56:'BEL',442:'LUX',
  233:'EST',428:'LVA',440:'LTU',112:'BLR',804:'UKR',268:'GEO',51:'ARM',31:'AZE',
  417:'KGZ',398:'KAZ',860:'UZB',795:'TKM',626:'TLS',
};

/**
 * @description Mapa SVG interactivo del mundo con colores TRS, zoom/pan, tooltip y
 * animación criticalPulse para países en riesgo crítico.
 *
 * Proyección Natural Earth: menor distorsión en países grandes, estándar en mapas
 * de riesgo corporativo (vs. Mercator que infla zonas polares).
 *
 * @param {Object}   props
 * @param {Array}    props.countries      - Perfiles mínimos del hook useRiskMap
 * @param {Array}    props.filteredCountries - Países que pasan los filtros activos
 * @param {string|null} props.selectedIso - ISO alpha-3 del país seleccionado
 * @param {Function} props.onSelectCountry - Callback al hacer click en un país
 */
export default function WorldMapSVG({ countries, filteredCountries, selectedIso, onSelectCountry }) {
  const containerRef = useRef(null);
  const svgRef       = useRef(null);
  const zoomRef      = useRef(null);
  const gRef         = useRef(null);

  const [topoData,  setTopoData]  = useState(null);
  const [tooltip,   setTooltip]   = useState({ visible: false, x: 0, y: 0, country: null });
  const [loadError, setLoadError] = useState(false);

  // Lookup rápido ISO alpha-3 → perfil de riesgo
  const profileMap = useRef({});
  useEffect(() => {
    profileMap.current = buildIsoNumericMap(countries);
  }, [countries]);

  // Lookup para saber si un país pasa los filtros activos
  const filteredSet = useRef(new Set());
  useEffect(() => {
    filteredSet.current = new Set(filteredCountries.map((c) => c.isoAlpha3));
  }, [filteredCountries]);

  // ── Fetch de TopoJSON ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch(TOPO_URL)
      .then((r) => r.json())
      .then(setTopoData)
      .catch(() => setLoadError(true));
  }, []);

  // ── Función de color por país ──────────────────────────────────────────────
  const getCountryColor = useCallback((numericId) => {
    const alpha3 = NUM_TO_ALPHA3[numericId];
    if (!alpha3) return RISK_COLORS.none;
    const profile = profileMap.current[alpha3];
    return profile ? (RISK_COLORS[profile.riskLevel] || RISK_COLORS.none) : RISK_COLORS.none;
  }, []);

  // ── Render D3 ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!topoData || !containerRef.current) return;

    const container = containerRef.current;
    const width  = container.clientWidth  || 800;
    const height = container.clientHeight || 420;

    // Limpiar SVG anterior antes de re-renderizar
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('width', '100%')
      .style('height', '100%')
      .style('background', '#020617'); // slate-950 — océano

    const projection = d3.geoNaturalEarth1()
      .scale(width / 6.28)
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(projection);

    // Graticule (meridianos y paralelos)
    const graticule = d3.geoGraticule();
    svg.append('path')
      .datum(graticule())
      .attr('d', path)
      .attr('fill', 'none')
      .attr('stroke', '#1e293b')
      .attr('stroke-width', 0.3)
      .attr('opacity', 0.5);

    const g = svg.append('g');
    gRef.current = g;

    const countries110m = topojson.feature(topoData, topoData.objects.countries);

    // Paths de países
    g.selectAll('path.country')
      .data(countries110m.features)
      .join('path')
      .attr('class', (d) => {
        const alpha3 = NUM_TO_ALPHA3[+d.id];
        const profile = alpha3 ? profileMap.current[alpha3] : null;
        return profile?.riskLevel === 'critical' ? 'country critical-pulse' : 'country';
      })
      .attr('d', path)
      .attr('fill', (d) => getCountryColor(+d.id))
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 0.5)
      .attr('opacity', (d) => {
        const alpha3 = NUM_TO_ALPHA3[+d.id];
        if (!alpha3) return 0.6;
        // Opacidad reducida si hay filtros activos y el país no los pasa
        if (filteredSet.current.size < profileMap.current && !filteredSet.current.has(alpha3)) return 0.12;
        return 0.85;
      })
      .style('cursor', (d) => NUM_TO_ALPHA3[+d.id] ? 'pointer' : 'default')
      .on('mouseenter', function (event, d) {
        const alpha3 = NUM_TO_ALPHA3[+d.id];
        const profile = alpha3 ? profileMap.current[alpha3] : null;
        if (!profile) return;

        d3.select(this)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.2)
          .attr('opacity', 1.0);

        const rect = container.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: event.clientX - rect.left + 12,
          y: event.clientY - rect.top - 10,
          country: profile,
        });
      })
      .on('mousemove', function (event) {
        const rect = container.getBoundingClientRect();
        setTooltip((prev) => ({
          ...prev,
          x: event.clientX - rect.left + 12,
          y: event.clientY - rect.top - 10,
        }));
      })
      .on('mouseleave', function (event, d) {
        const alpha3 = NUM_TO_ALPHA3[+d.id];
        const isSelected = alpha3 === selectedIso;
        d3.select(this)
          .attr('stroke', isSelected ? '#ffffff' : '#0f172a')
          .attr('stroke-width', isSelected ? 1.8 : 0.5)
          .attr('opacity', isSelected ? 1.0 : 0.85);
        setTooltip((prev) => ({ ...prev, visible: false }));
      })
      .on('click', function (event, d) {
        const alpha3 = NUM_TO_ALPHA3[+d.id];
        if (!alpha3 || !profileMap.current[alpha3]) return;
        onSelectCountry(alpha3);
      });

    // ── Zoom y pan ─────────────────────────────────────────────────────────
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomRef.current = zoom;

    // ── ResizeObserver — mapa responsive ──────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      svg.attr('viewBox', `0 0 ${w} ${h}`);
      projection
        .scale(w / 6.28)
        .translate([w / 2, h / 2]);
      g.selectAll('path.country').attr('d', path);
    });
    ro.observe(container);

    return () => ro.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topoData, getCountryColor]);

  // ── Re-pintar colores cuando llegan datos del backend ─────────────────────
  // El render D3 puede ocurrir antes que countries[] llegue (race condition CDN vs API).
  // Este efecto corre DESPUÉS del efecto que actualiza profileMap.current.
  useEffect(() => {
    if (!gRef.current || !countries.length) return;
    gRef.current.selectAll('path.country')
      .attr('fill', (d) => getCountryColor(+d.id))
      .attr('class', (d) => {
        const alpha3 = NUM_TO_ALPHA3[+d.id];
        const profile = alpha3 ? profileMap.current[alpha3] : null;
        return profile?.riskLevel === 'critical' ? 'country critical-pulse' : 'country';
      });
  }, [countries, getCountryColor]);

  // ── Actualizar opacidad y stroke cuando cambian filtros o selección ────────
  useEffect(() => {
    if (!gRef.current) return;
    gRef.current.selectAll('path.country')
      .attr('opacity', (d) => {
        const alpha3 = NUM_TO_ALPHA3[+d.id];
        if (!alpha3) return 0.6;
        if (alpha3 === selectedIso) return 1.0;
        const hasFilter = filteredCountries.length < countries.length;
        if (hasFilter && !filteredSet.current.has(alpha3)) return 0.12;
        return 0.85;
      })
      .attr('stroke', (d) => {
        const alpha3 = NUM_TO_ALPHA3[+d.id];
        return alpha3 === selectedIso ? '#ffffff' : '#0f172a';
      })
      .attr('stroke-width', (d) => {
        const alpha3 = NUM_TO_ALPHA3[+d.id];
        return alpha3 === selectedIso ? 1.8 : 0.5;
      })
      .style('filter', (d) => {
        const alpha3 = NUM_TO_ALPHA3[+d.id];
        return alpha3 === selectedIso
          ? 'drop-shadow(0 0 5px rgba(255,255,255,0.25))'
          : 'none';
      });
  }, [selectedIso, filteredCountries, countries]);

  // ── Controles de zoom ──────────────────────────────────────────────────────
  const handleZoomIn  = () => zoomRef.current && d3.select(svgRef.current).call(zoomRef.current.scaleBy, 1.5);
  const handleZoomOut = () => zoomRef.current && d3.select(svgRef.current).call(zoomRef.current.scaleBy, 0.67);
  const handleReset   = () => zoomRef.current && d3.select(svgRef.current).call(zoomRef.current.transform, d3.zoomIdentity);

  // ── Skeleton de carga ──────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        No se pudo cargar el mapa. Verifica tu conexión.
      </div>
    );
  }

  if (!topoData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-full h-full bg-slate-800 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[380px]">
      {/* SVG del mapa */}
      <svg ref={svgRef} className="w-full h-full" />

      {/* Tooltip flotante — pointer-events:none para no interferir con clicks */}
      {tooltip.visible && tooltip.country && (
        <div
          className="absolute z-10 pointer-events-none bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 shadow-lg text-xs"
          style={{ left: tooltip.x, top: tooltip.y, maxWidth: 180 }}
        >
          <p className="font-semibold text-white">{tooltip.country.countryNameEs}</p>
          <p className="text-slate-400 font-mono">
            TRS{' '}
            <span style={{ color: RISK_COLORS[tooltip.country.riskLevel] }}>
              {parseFloat(tooltip.country.trsOverall).toFixed(1)}
            </span>
          </p>
        </div>
      )}

      {/* Controles de zoom */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
        {[
          { Icon: ZoomIn,    label: '+', fn: handleZoomIn },
          { Icon: Maximize2, label: '⊙', fn: handleReset },
          { Icon: ZoomOut,   label: '−', fn: handleZoomOut },
        ].map(({ Icon, label, fn }) => (
          <button
            key={label}
            onClick={fn}
            className="w-7 h-7 flex items-center justify-center bg-slate-800 border border-slate-600 rounded text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-xs"
            title={label}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
