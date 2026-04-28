const PDFDocument = require('pdfkit');

// Paleta profesional para el PDF (fondo blanco, legible en papel)
const COLORS = {
  primary:   '#2563eb', // blue-600
  accent:    '#1e40af', // blue-800
  success:   '#059669', // emerald-600
  danger:    '#dc2626', // red-600
  warning:   '#d97706', // amber-600
  text:      '#111827', // gray-900
  secondary: '#4b5563', // gray-600
  muted:     '#9ca3af', // gray-400
  border:    '#e5e7eb', // gray-200
  bgLight:   '#f9fafb', // gray-50
};

/**
 * @description Dibuja una línea divisoria horizontal.
 * @param {PDFDocument} doc
 * @param {number} [y] - Posición Y opcional
 */
function drawDivider(doc, y) {
  const posY = y ?? doc.y;
  doc.moveTo(50, posY).lineTo(545, posY).strokeColor(COLORS.border).lineWidth(0.5).stroke();
}

/**
 * @description Dibuja una fila de tabla con dos columnas (label + valor).
 * @param {PDFDocument} doc
 * @param {string} label
 * @param {string} value
 * @param {boolean} [highlight=false] - Fondo azul claro para la fila
 */
function tableRow(doc, label, value, highlight = false) {
  const rowY = doc.y;
  const rowH = 20;

  if (highlight) {
    doc.rect(50, rowY, 495, rowH).fill('#eff6ff').fillColor(COLORS.text);
  }

  doc
    .fontSize(9)
    .fillColor(COLORS.secondary)
    .text(label, 55, rowY + 5, { width: 200 })
    .fillColor(COLORS.text)
    .text(String(value || '—'), 260, rowY + 5, { width: 280 });

  doc.y = rowY + rowH;
}

/**
 * @description Genera un PDF profesional con el resultado completo de una clasificación arancelaria.
 *              Incluye: HS code, países, aranceles, análisis espejo (si Pro+), documentos y fuentes.
 * @param {object} classification - Registro completo de Classifications con resultJson y fuentes
 * @returns {Promise<Buffer>} Buffer del PDF listo para enviar como response
 */
async function generateClassificationPDF(classification) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4', compress: true });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const result = classification.resultJson || {};
    const mirror = classification.mirrorAnalysis || result.mirrorAnalysis;
    const tariff = result.tariffData;
    const now = new Date();
    const dateStr = now.toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' });

    // ── ENCABEZADO ────────────────────────────────────────────────
    doc
      .fontSize(22).fillColor(COLORS.primary).text('TaricAI', 50, 50, { continued: true })
      .fontSize(10).fillColor(COLORS.muted).text('  ·  Clasificación Arancelaria con IA', { align: 'left' })
      .moveDown(0.3);

    doc.fontSize(9).fillColor(COLORS.muted)
      .text(`Emitido: ${dateStr}  ·  ID: ${classification.id?.slice(0, 16)}...`, { align: 'left' });

    doc.moveDown(0.5);
    drawDivider(doc);
    doc.moveDown(0.8);

    // ── CÓDIGO HS ─────────────────────────────────────────────────
    doc
      .fontSize(11).fillColor(COLORS.secondary).text('CÓDIGO HS INTERNACIONAL', { align: 'center' })
      .fontSize(36).fillColor(COLORS.primary)
      .font('Courier-Bold').text(classification.hsCode || '------', { align: 'center' })
      .font('Helvetica');

    if (result.primaryHsDescription) {
      doc.fontSize(10).fillColor(COLORS.secondary)
        .text(result.primaryHsDescription, { align: 'center' });
    }
    doc.moveDown(0.8);

    // ── PRODUCTO ──────────────────────────────────────────────────
    if (result.productDescription) {
      doc.fontSize(11).fillColor(COLORS.text).font('Helvetica-Bold').text('Descripción del producto')
        .font('Helvetica').fontSize(10).fillColor(COLORS.secondary)
        .text(result.productDescription, { lineGap: 2 });
      doc.moveDown(0.6);
    }

    // ── RUTA COMERCIAL ────────────────────────────────────────────
    doc.fontSize(11).fillColor(COLORS.text).font('Helvetica-Bold').text('Ruta comercial');
    doc.font('Helvetica').moveDown(0.2);

    const exporterLabel = `Exportador: ${classification.originCountry || '—'}`;
    const importerLabel = `Importador: ${classification.destCountry || '—'}`;
    doc.fontSize(10).fillColor(COLORS.secondary)
      .text(`${exporterLabel}   →   ${importerLabel}`, { align: 'left' });

    if (classification.hsCodeOrigin || classification.hsCodeDest) {
      doc.moveDown(0.2);
      doc.font('Courier').fontSize(9).fillColor(COLORS.primary)
        .text(`Subpartida exportador: ${classification.hsCodeOrigin || '—'}   ·   Subpartida importador: ${classification.hsCodeDest || '—'}`);
      doc.font('Helvetica');
    }

    if (classification.confidence !== null && classification.confidence !== undefined) {
      doc.fontSize(9).fillColor(COLORS.muted)
        .text(`Confianza arancelaria: ${classification.confidence}%`);
    }

    doc.moveDown(0.8);
    drawDivider(doc);
    doc.moveDown(0.6);

    // ── ARANCELES E IMPUESTOS ─────────────────────────────────────
    if (tariff) {
      doc.fontSize(11).fillColor(COLORS.text).font('Helvetica-Bold').text('Aranceles e Impuestos')
        .font('Helvetica').moveDown(0.3);

      if (tariff.tradeAgreement) {
        doc.fontSize(9).fillColor(COLORS.success)
          .text(`✓ Acuerdo comercial activo: ${tariff.tradeAgreement}`, { lineGap: 2 });
      }
      doc.moveDown(0.2);

      // Tabla de aranceles
      const tarifRows = [
        ['Arancel MFN',          tariff.mfnRate],
        ['Arancel preferencial', tariff.preferentialRate],
        ['IVA / GST importador', tariff.vat],
        ...(tariff.specialTaxes || []).map(t => [typeof t === 'string' ? t : t.name, typeof t === 'string' ? '—' : t.rate]),
      ].filter(([, v]) => v);

      tarifRows.forEach(([label, value], i) => tableRow(doc, label, value, i % 2 === 0));
      doc.moveDown(0.8);
    }

    // ── ANÁLISIS ESPEJO ───────────────────────────────────────────
    if (mirror) {
      drawDivider(doc);
      doc.moveDown(0.6);
      doc.fontSize(11).fillColor(COLORS.text).font('Helvetica-Bold').text('Análisis Espejo')
        .font('Helvetica').moveDown(0.3);

      const risk = mirror.riskAssessment;
      if (risk) {
        const riskColor = risk.level === 'low' ? COLORS.success : risk.level === 'medium' ? COLORS.warning : COLORS.danger;
        doc.fontSize(9).fillColor(riskColor)
          .text(`Riesgo aduanero: ${risk.level?.toUpperCase()} (${risk.probability}%)`, { lineGap: 2 });
        doc.fillColor(COLORS.secondary).text(risk.explanation || '', { lineGap: 2 });
        doc.moveDown(0.2);
      }

      if (mirror.recommendedSubheading?.code) {
        doc.fontSize(9).fillColor(COLORS.primary).font('Courier-Bold')
          .text(`Subpartida recomendada: ${mirror.recommendedSubheading.code}`)
          .font('Helvetica').fillColor(COLORS.secondary)
          .text(mirror.recommendedSubheading.rationale || '', { lineGap: 2 });
        doc.moveDown(0.3);
      }

      if (mirror.criticalAlerts?.length) {
        doc.fontSize(9).fillColor(COLORS.danger).font('Helvetica-Bold').text('Alertas críticas:')
          .font('Helvetica');
        mirror.criticalAlerts.forEach(a => {
          doc.fillColor(COLORS.danger).text(`⚠  ${a.description}`, { indent: 10, lineGap: 2 });
        });
        doc.moveDown(0.3);
      }
    }

    // ── DOCUMENTOS REQUERIDOS ─────────────────────────────────────
    const exportDocs = tariff?.requiredDocumentsExport || [];
    const importDocs = tariff?.requiredDocumentsImport || [];

    if (exportDocs.length || importDocs.length) {
      drawDivider(doc);
      doc.moveDown(0.6);
      doc.fontSize(11).fillColor(COLORS.text).font('Helvetica-Bold').text('Documentos Requeridos')
        .font('Helvetica').moveDown(0.3);

      if (exportDocs.length) {
        doc.fontSize(9).fillColor(COLORS.secondary).font('Helvetica-Bold').text('Para exportar:').font('Helvetica');
        exportDocs.forEach(d => doc.fillColor(COLORS.text).fontSize(9).text(`  • ${typeof d === 'string' ? d : d.name}`, { lineGap: 1 }));
        doc.moveDown(0.3);
      }
      if (importDocs.length) {
        doc.fontSize(9).fillColor(COLORS.secondary).font('Helvetica-Bold').text('Para importar:').font('Helvetica');
        importDocs.forEach(d => doc.fillColor(COLORS.text).fontSize(9).text(`  • ${typeof d === 'string' ? d : d.name}`, { lineGap: 1 }));
      }
      doc.moveDown(0.6);
    }

    // ── DESGLOSE DE COSTOS ────────────────────────────────────────
    const costs = tariff?.estimatedCosts;
    if (costs && (costs.customsDuty || costs.vat || costs.portFees)) {
      drawDivider(doc);
      doc.moveDown(0.6);
      doc.fontSize(11).fillColor(COLORS.text).font('Helvetica-Bold').text('Desglose de Costos Estimados')
        .font('Helvetica').moveDown(0.3);

      [
        ['Arancel aduanero', costs.customsDuty],
        ['IVA / GST', costs.vat],
        ['Tasas portuarias', costs.portFees],
        ['Total estimado', costs.total],
      ].filter(([, v]) => v).forEach(([l, v], i) => tableRow(doc, l, v, i === 3));

      doc.fontSize(7).fillColor(COLORS.muted).moveDown(0.2)
        .text('* Valores referenciales. Confirmar con agente de carga.', { lineGap: 2 });
      doc.moveDown(0.6);
    }

    // ── PIE DE PÁGINA ─────────────────────────────────────────────
    drawDivider(doc);
    doc.moveDown(0.4);
    const sourceCount = result.sourcesConsulted || 0;
    doc.fontSize(8).fillColor(COLORS.muted)
      .text(`Documento generado por TaricAI · ${sourceCount} fuentes oficiales consultadas · ${dateStr}`, { align: 'center', lineGap: 2 })
      .text('Este informe es referencial y no reemplaza la opinión de un especialista en comercio exterior.', { align: 'center' });

    doc.end();
  });
}

module.exports = { generateClassificationPDF };
