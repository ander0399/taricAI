const { USER_IDS, COMPANY_IDS } = require('../helpers/uuid.helper');
const { getAdriatikaClassificationDate } = require('../helpers/dates.helper');

// ─── Builders de mirrorAnalysis ───────────────────────────────────────────────

function mirrorLow(hsOrigin, hsDest, agreement, prefRate, stdRate) {
  return {
    concordance: {
      hsCodeOrigin: hsOrigin, hsCodeDest: hsDest, discrepancyLevel: 'low',
      explanation: 'Subpartidas concordantes a nivel HS-6. La diferencia en extensión nacional no genera impacto en derechos arancelarios aplicables.',
    },
    riskAssessment: { level: 'low', probability: 12, mainRisk: 'Diferencia en nomenclatura nacional sin impacto en tasa ni en requisitos documentales.' },
    rulesOfOrigin: { agreementApplies: !!agreement, agreementName: agreement || null, preferentialRate: prefRate || null, standardRate: stdRate || null, ruleApplied: agreement ? 'Cambio de partida arancelaria (CPA) — criterio de transformación sustancial cumplido.' : null },
    recommendedSubheading: { code: hsDest, justification: 'Confirmado en fuente oficial del país importador.' },
    criticalAlerts: [],
  };
}

function mirrorMedium(hsOrigin, hsDest, risk, probability, mainRisk) {
  return {
    concordance: { hsCodeOrigin: hsOrigin, hsCodeDest: hsDest, discrepancyLevel: 'medium', explanation: 'Diferencia en subpartida a nivel HS-8 que puede implicar tasas distintas en el país destino.' },
    riskAssessment: { level: 'medium', probability, mainRisk },
    rulesOfOrigin: { agreementApplies: false, agreementName: null, preferentialRate: null, standardRate: null, ruleApplied: null },
    recommendedSubheading: { code: hsDest, justification: 'Verificar con autoridad aduanera del país importador antes de la declaración.' },
    criticalAlerts: [],
  };
}

function mirrorCritical(hsOrigin, hsDest, alerts) {
  return {
    concordance: { hsCodeOrigin: hsOrigin, hsCodeDest: hsDest, discrepancyLevel: 'critical', explanation: `Subpartida exportador (${hsOrigin}) diverge significativamente de la del importador (${hsDest}). Implica tasas distintas y posible medida aplicable.` },
    riskAssessment: { level: 'critical', probability: 87, mainRisk: 'Alta probabilidad de retención en aduana por divergencia de nomenclatura. Riesgo de liquidación adicional.' },
    rulesOfOrigin: { agreementApplies: false, agreementName: null, preferentialRate: null, standardRate: null, ruleApplied: null },
    recommendedSubheading: { code: hsDest, justification: 'Requiere dictamen vinculante de la autoridad aduanera del país importador.' },
    criticalAlerts: alerts,
  };
}

// ─── Builder de resultJson ────────────────────────────────────────────────────

function result(description, hsCode, hsOrigin, hsDest, originCountry, destCountry, exportDuty, importDuty, vat, antidumping, agreement, prefRate) {
  const date = new Date().toISOString();
  return {
    product: { description, category: 'Clasificación arancelaria IA', inputType: 'text' },
    classification: {
      hsCode, hsCodeOrigin: hsOrigin, hsCodeDest: hsDest,
      description: `Subpartida ${hsCode} — verificada contra nomenclaturas oficiales de ${originCountry} y ${destCountry}.`,
      chapter: `Capítulo ${hsCode.substring(0, 2)}`, section: 'Verificado SA 2022',
    },
    tariffs: {
      origin: { country: originCountry, exportDuty: exportDuty || '0%', vatExport: null, exportLicense: false },
      destination: { country: destCountry, importDuty: importDuty || '5%', vatImport: vat || '19%', antidumping: antidumping || null, importLicense: false, estimatedTotal: `${importDuty} + ${vat} sobre valor CIF` },
    },
    sources: [
      { name: 'WCO HS Database', url: 'https://www.wcoomd.org/hs-nomenclature-2022-edition.aspx', status: 'ok' },
      { name: 'ITC Market Access Map', url: 'https://www.macmap.org', status: 'ok' },
    ],
    rulesOfOrigin: agreement ? { agreement, preferentialRate: prefRate || '0%' } : null,
    generatedAt: date,
  };
}

// ─── ID helpers ───────────────────────────────────────────────────────────────

const cid = (company, n) => `a${company}000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

// ─── Empresa 1: Logística Andina S.A.S — Free (5 clasificaciones) ─────────────
// confidence: null, mirrorAnalysis: null — plan Free no tiene estas features

const ANDINA = [
  { id: cid(1,1), userId: USER_IDS.owner_andina, companyId: COMPANY_IDS.andina, inputType: 'text', inputData: 'Café verde sin tostar, en grano, para exportación', originCountry: 'COL', destCountry: 'USA', hsCode: '090111', hsCodeOrigin: null, hsCodeDest: null, confidence: null, mirrorAnalysis: null, resultJson: result('Café verde sin tostar en grano','090111','090111','090111.00','COL','USA','0%','0%','0%',null,'TLC Colombia-USA','0%'), status: 'completed' },
  { id: cid(1,2), userId: USER_IDS.owner_andina, companyId: COMPANY_IDS.andina, inputType: 'text', inputData: 'Calzado deportivo con suela de caucho y parte superior de cuero', originCountry: 'COL', destCountry: 'MEX', hsCode: '640299', hsCodeOrigin: null, hsCodeDest: null, confidence: null, mirrorAnalysis: null, resultJson: result('Calzado deportivo suela caucho parte superior cuero','640299','640299','640299.00','COL','MEX','0%','20%','16%',null,null,null), status: 'completed' },
  { id: cid(1,3), userId: USER_IDS.owner_andina, companyId: COMPANY_IDS.andina, inputType: 'text', inputData: 'Flores cortadas frescas, rosas, para uso ornamental', originCountry: 'COL', destCountry: 'NLD', hsCode: '060311', hsCodeOrigin: null, hsCodeDest: null, confidence: null, mirrorAnalysis: null, resultJson: result('Flores cortadas frescas rosas ornamentales','060311','060311','060311.00','COL','NLD','0%','0%','21%',null,'TLC Colombia-UE','0%'), status: 'completed' },
  { id: cid(1,4), userId: USER_IDS.owner_andina, companyId: COMPANY_IDS.andina, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_andina_04.jpg', originCountry: 'COL', destCountry: 'BRA', hsCode: '080300', hsCodeOrigin: null, hsCodeDest: null, confidence: null, mirrorAnalysis: null, resultJson: result('Bananos frescos exportación','080300','080300','080300.00','COL','BRA','0%','10.8%','12%',null,null,null), status: 'completed' },
  { id: cid(1,5), userId: USER_IDS.owner_andina, companyId: COMPANY_IDS.andina, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_andina_05.jpg', originCountry: 'COL', destCountry: 'ECU', hsCode: '030194', hsCodeOrigin: null, hsCodeDest: null, confidence: null, mirrorAnalysis: null, resultJson: result('Atún vivo para acuicultura','030194','030194','030194.00','COL','ECU','0%','5%','12%',null,null,null), status: 'completed' },
];

// ─── Empresa 2: GlobalTrade Solutions — Pro (12 clasificaciones) ──────────────
// confidence: 76-95, mirrorAnalysis completo, inputType: text/image/ocr

const GLOBALTRADE = [
  { id: cid(2,1), userId: USER_IDS.owner_globaltrade, companyId: COMPANY_IDS.globaltrade, inputType: 'text', inputData: 'Laptops portátiles, procesador Intel Core i7, 16GB RAM, 512GB SSD', originCountry: 'CHN', destCountry: 'COL', hsCode: '847130', hsCodeOrigin: '8471.30', hsCodeDest: '8471.30.00', confidence: 92, mirrorAnalysis: mirrorLow('8471.30','8471.30.00','TLC Colombia-USA','0%','5%'), resultJson: result('Laptops portátiles Intel i7 16GB 512GB','847130','8471.30','8471.30.00','CHN','COL','0%','5%','19%',null,'TLC Colombia-USA','0%'), status: 'completed' },
  { id: cid(2,2), userId: USER_IDS.owner_globaltrade, companyId: COMPANY_IDS.globaltrade, inputType: 'text', inputData: 'Aceite de palma en bruto, para uso alimentario', originCountry: 'COL', destCountry: 'IND', hsCode: '151110', hsCodeOrigin: '1511.10', hsCodeDest: '1511.10.00', confidence: 88, mirrorAnalysis: mirrorLow('1511.10','1511.10.00',null,null,'7.5%'), resultJson: result('Aceite de palma en bruto uso alimentario','151110','1511.10','1511.10.00','COL','IND','0%','7.5%','18%',null,null,null), status: 'completed' },
  { id: cid(2,3), userId: USER_IDS.owner_globaltrade, companyId: COMPANY_IDS.globaltrade, inputType: 'text', inputData: 'Autopartes: amortiguadores de suspensión delantera', originCountry: 'MEX', destCountry: 'COL', hsCode: '870880', hsCodeOrigin: '8708.80', hsCodeDest: '8708.80.00', confidence: 85, mirrorAnalysis: mirrorLow('8708.80','8708.80.00','TLC Colombia-México','0%','5%'), resultJson: result('Amortiguadores suspensión delantera automotriz','870880','8708.80','8708.80.00','MEX','COL','0%','5%','19%',null,'TLC Colombia-México','0%'), status: 'completed' },
  { id: cid(2,4), userId: USER_IDS.owner_globaltrade, companyId: COMPANY_IDS.globaltrade, inputType: 'text', inputData: 'Válvulas de seguridad para tuberías industriales de acero inoxidable', originCountry: 'DEU', destCountry: 'COL', hsCode: '848110', hsCodeOrigin: '8481.10', hsCodeDest: '8481.10.00', confidence: 90, mirrorAnalysis: mirrorLow('8481.10','8481.10.00','TLC Colombia-UE','0%','5%'), resultJson: result('Válvulas de seguridad acero inoxidable industrial','848110','8481.10','8481.10.00','DEU','COL','0%','5%','19%',null,'TLC Colombia-UE','0%'), status: 'completed' },
  { id: cid(2,5), userId: USER_IDS.owner_globaltrade, companyId: COMPANY_IDS.globaltrade, inputType: 'text', inputData: 'Vino tinto embotellado, D.O. Rioja, capacidad 750 ml', originCountry: 'ESP', destCountry: 'BRA', hsCode: '220421', hsCodeOrigin: '2204.21', hsCodeDest: '2204.21.00', confidence: 95, mirrorAnalysis: mirrorLow('2204.21','2204.21.00',null,null,'27%'), resultJson: result('Vino tinto D.O. Rioja botella 750ml','220421','2204.21','2204.21.00','ESP','BRA','0%','27%','12%',null,null,null), status: 'completed' },
  { id: cid(2,6), userId: USER_IDS.owner_globaltrade, companyId: COMPANY_IDS.globaltrade, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_gt_06.jpg', originCountry: 'JPN', destCountry: 'COL', hsCode: '841830', hsCodeOrigin: '8418.30', hsCodeDest: '8418.30.00', confidence: 89, mirrorAnalysis: mirrorLow('8418.30','8418.30.00','TLC Colombia-Japón','0%','5%'), resultJson: result('Congeladores tipo cofre uso comercial','841830','8418.30','8418.30.00','JPN','COL','0%','5%','19%',null,null,null), status: 'completed' },
  { id: cid(2,7), userId: USER_IDS.owner_globaltrade, companyId: COMPANY_IDS.globaltrade, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_gt_07.jpg', originCountry: 'USA', destCountry: 'MEX', hsCode: '902130', hsCodeOrigin: '9021.30', hsCodeDest: '9021.30.00', confidence: 87, mirrorAnalysis: mirrorMedium('9021.30','9021.30.00','medium', 38,'Dispositivo médico puede requerir clasificación diferente según funcionalidad específica.'), resultJson: result('Prótesis articulares miembros inferiores','902130','9021.30','9021.30.00','USA','MEX','0%','0%','16%',null,null,null), status: 'completed' },
  { id: cid(2,8), userId: USER_IDS.owner_globaltrade, companyId: COMPANY_IDS.globaltrade, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_gt_08.jpg', originCountry: 'KOR', destCountry: 'COL', hsCode: '851712', hsCodeOrigin: '8517.12', hsCodeDest: '8517.12.00', confidence: 91, mirrorAnalysis: mirrorLow('8517.12','8517.12.00',null,null,'10%'), resultJson: result('Teléfonos móviles smartphones','851712','8517.12','8517.12.00','KOR','COL','0%','10%','19%',null,null,null), status: 'completed' },
  { id: cid(2,9), userId: USER_IDS.owner_globaltrade, companyId: COMPANY_IDS.globaltrade, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_gt_09.jpg', originCountry: 'DEU', destCountry: 'PER', hsCode: '840991', hsCodeOrigin: '8409.91', hsCodeDest: '8409.91.00', confidence: 83, mirrorAnalysis: mirrorMedium('8409.91','8409.91.00','medium',42,'Partes de motor pueden aplicar subpartida diferente según tipo de motor.'), resultJson: result('Partes para motores de explosión gasolina','840991','8409.91','8409.91.00','DEU','PER','0%','6%','18%',null,null,null), status: 'completed' },
  { id: cid(2,10), userId: USER_IDS.owner_globaltrade, companyId: COMPANY_IDS.globaltrade, inputType: 'ocr', inputData: 'https://res.cloudinary.com/taricai/seed/factura_gt_10.pdf', originCountry: 'USA', destCountry: 'COL', hsCode: '300490', hsCodeOrigin: '3004.90', hsCodeDest: '3004.90.00', confidence: 78, mirrorAnalysis: mirrorMedium('3004.90','3004.90.00','medium',55,'Medicamentos requieren clasificación por principio activo — verificar con INVIMA.'), resultJson: result('Medicamentos preparaciones mixtas uso terapéutico','300490','3004.90','3004.90.00','USA','COL','0%','0%','5%',null,null,null), status: 'completed' },
  { id: cid(2,11), userId: USER_IDS.owner_globaltrade, companyId: COMPANY_IDS.globaltrade, inputType: 'ocr', inputData: 'https://res.cloudinary.com/taricai/seed/ficha_tecnica_gt_11.pdf', originCountry: 'CHN', destCountry: 'MEX', hsCode: '392690', hsCodeOrigin: '3926.90', hsCodeDest: '3926.90.99', confidence: 82, mirrorAnalysis: mirrorLow('3926.90','3926.90.99',null,null,'15%'), resultJson: result('Artículos plástico uso industrial y decorativo','392690','3926.90','3926.90.99','CHN','MEX','0%','15%','16%',null,null,null), status: 'completed' },
  { id: cid(2,12), userId: USER_IDS.owner_globaltrade, companyId: COMPANY_IDS.globaltrade, inputType: 'ocr', inputData: 'https://res.cloudinary.com/taricai/seed/factura_gt_12.pdf', originCountry: 'BRA', destCountry: 'COL', hsCode: '210690', hsCodeOrigin: '2106.90', hsCodeDest: '2106.90.00', confidence: 76, mirrorAnalysis: mirrorMedium('2106.90','2106.90.00','medium',48,'Preparaciones alimenticias pueden clasificar diferente según composición exacta.'), resultJson: result('Preparaciones alimenticias complementos nutricionales','210690','2106.90','2106.90.00','BRA','COL','0%','10%','19%',null,null,null), status: 'completed' },
];

// ─── Empresa 3: ComerExport Group — Team activo (45 clasificaciones) ──────────

const COMEREXPORT = [
  // owner_comer — 8 clasificaciones (4 text + 4 image)
  { id: cid(3,1), userId: USER_IDS.owner_comer, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Soja en grano, para siembra o uso industrial oleaginoso', originCountry: 'BRA', destCountry: 'CHN', hsCode: '120110', hsCodeOrigin: '1201.10', hsCodeDest: '1201.10.00', confidence: 94, mirrorAnalysis: mirrorLow('1201.10','1201.10.00',null,null,'3%'), resultJson: result('Soja en grano para siembra uso industrial','120110','1201.10','1201.10.00','BRA','CHN','0%','3%','9%',null,null,null), status: 'completed' },
  { id: cid(3,2), userId: USER_IDS.owner_comer, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Mineral de cobre concentrado con contenido de molibdeno', originCountry: 'PER', destCountry: 'KOR', hsCode: '260300', hsCodeOrigin: '2603.00', hsCodeDest: '2603.00.00', confidence: 91, mirrorAnalysis: mirrorLow('2603.00','2603.00.00',null,null,'0%'), resultJson: result('Mineral cobre concentrado con molibdeno','260300','2603.00','2603.00.00','PER','KOR','0%','0%','10%',null,null,null), status: 'completed' },
  { id: cid(3,3), userId: USER_IDS.owner_comer, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Harina de trigo para panadería, tipo 000', originCountry: 'ARG', destCountry: 'COL', hsCode: '110100', hsCodeOrigin: '1101.00', hsCodeDest: '1101.00.00', confidence: 97, mirrorAnalysis: mirrorLow('1101.00','1101.00.00',null,null,'20%'), resultJson: result('Harina trigo panadería tipo 000','110100','1101.00','1101.00.00','ARG','COL','0%','20%','19%',null,null,null), status: 'completed' },
  // discrepancyLevel: 'high' en owner_comer según spec
  { id: cid(3,4), userId: USER_IDS.owner_comer, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Chatarra de hierro y acero, fragmentada, para reciclaje siderúrgico', originCountry: 'USA', destCountry: 'TUR', hsCode: '720449', hsCodeOrigin: '7204.49', hsCodeDest: '7204.49.10', confidence: 78, mirrorAnalysis: mirrorCritical('7204.49','7204.49.10',[{type:'antidumping',description:'Medida antidumping aplicable a chatarra de acero en Turquía según Reglamento 2021/45.'},{type:'license',description:'Requiere licencia de importación y certificado de composición química para chatarra.'}]), resultJson: result('Chatarra hierro acero fragmentada reciclaje','720449','7204.49','7204.49.10','USA','TUR','0%','0%','18%','Sí — verificar Reg. 2021/45',null,null), status: 'completed' },
  { id: cid(3,5), userId: USER_IDS.owner_comer, companyId: COMPANY_IDS.comerexport, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_comer_05.jpg', originCountry: 'COL', destCountry: 'DEU', hsCode: '330612', hsCodeOrigin: '3306.12', hsCodeDest: '3306.12.00', confidence: 88, mirrorAnalysis: mirrorLow('3306.12','3306.12.00','TLC Colombia-UE','0%','5%'), resultJson: result('Hilo dental higiene bucal','330612','3306.12','3306.12.00','COL','DEU','0%','0%','19%',null,'TLC Colombia-UE','0%'), status: 'completed' },
  { id: cid(3,6), userId: USER_IDS.owner_comer, companyId: COMPANY_IDS.comerexport, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_comer_06.jpg', originCountry: 'IND', destCountry: 'COL', hsCode: '520811', hsCodeOrigin: '5208.11', hsCodeDest: '5208.11.00', confidence: 86, mirrorAnalysis: mirrorLow('5208.11','5208.11.00',null,null,'10%'), resultJson: result('Tejidos algodón sin blanquear tafetán peso max 100g','520811','5208.11','5208.11.00','IND','COL','0%','10%','19%',null,null,null), status: 'completed' },
  { id: cid(3,7), userId: USER_IDS.owner_comer, companyId: COMPANY_IDS.comerexport, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_comer_07.jpg', originCountry: 'CHN', destCountry: 'BRA', hsCode: '940360', hsCodeOrigin: '9403.60', hsCodeDest: '9403.60.00', confidence: 83, mirrorAnalysis: mirrorMedium('9403.60','9403.60.00','medium',35,'Muebles madera pueden requerir certificación FSC según normativa importador.'), resultJson: result('Muebles de madera uso doméstico','940360','9403.60','9403.60.00','CHN','BRA','0%','18%','12%',null,null,null), status: 'completed' },
  { id: cid(3,8), userId: USER_IDS.owner_comer, companyId: COMPANY_IDS.comerexport, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_comer_08.jpg', originCountry: 'VNM', destCountry: 'USA', hsCode: '640419', hsCodeOrigin: '6404.19', hsCodeDest: '6404.19.90', confidence: 82, mirrorAnalysis: mirrorLow('6404.19','6404.19.90',null,null,'37.5%'), resultJson: result('Calzado suela caucho parte superior textil','640419','6404.19','6404.19.90','VNM','USA','0%','37.5%','0%',null,null,null), status: 'completed' },

  // admin_comer_1 — 7 text (textiles y confección)
  { id: cid(3,9), userId: USER_IDS.admin_comer_1, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Camisas de algodón para hombre, tejido de punto, talla L', originCountry: 'BGD', destCountry: 'COL', hsCode: '610510', hsCodeOrigin: '6105.10', hsCodeDest: '6105.10.00', confidence: 93, mirrorAnalysis: mirrorLow('6105.10','6105.10.00',null,null,'15%'), resultJson: result('Camisas algodón hombre tejido punto talla L','610510','6105.10','6105.10.00','BGD','COL','0%','15%','19%',null,null,null), status: 'completed' },
  { id: cid(3,10), userId: USER_IDS.admin_comer_1, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Pantalones de mezclilla (denim) para mujer, 98% algodón 2% elastano', originCountry: 'MEX', destCountry: 'COL', hsCode: '620462', hsCodeOrigin: '6204.62', hsCodeDest: '6204.62.00', confidence: 90, mirrorAnalysis: mirrorLow('6204.62','6204.62.00','TLC Colombia-México','0%','15%'), resultJson: result('Pantalones denim mujer 98% algodón 2% elastano','620462','6204.62','6204.62.00','MEX','COL','0%','0%','19%',null,'TLC Colombia-México','0%'), status: 'completed' },
  { id: cid(3,11), userId: USER_IDS.admin_comer_1, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Ropa interior masculina de algodón, calzoncillos tipo boxer', originCountry: 'TUR', destCountry: 'COL', hsCode: '610711', hsCodeOrigin: '6107.11', hsCodeDest: '6107.11.00', confidence: 95, mirrorAnalysis: mirrorLow('6107.11','6107.11.00',null,null,'15%'), resultJson: result('Ropa interior masculina boxer algodón','610711','6107.11','6107.11.00','TUR','COL','0%','15%','19%',null,null,null), status: 'completed' },
  { id: cid(3,12), userId: USER_IDS.admin_comer_1, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Calcetines de lana para uso deportivo de montaña', originCountry: 'ITA', destCountry: 'COL', hsCode: '611592', hsCodeOrigin: '6115.92', hsCodeDest: '6115.92.00', confidence: 88, mirrorAnalysis: mirrorLow('6115.92','6115.92.00','TLC Colombia-UE','0%','15%'), resultJson: result('Calcetines lana deporte montaña','611592','6115.92','6115.92.00','ITA','COL','0%','0%','19%',null,'TLC Colombia-UE','0%'), status: 'completed' },
  { id: cid(3,13), userId: USER_IDS.admin_comer_1, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Tela de poliéster tejida cruda, ancho 150 cm, peso 200 g/m²', originCountry: 'CHN', destCountry: 'COL', hsCode: '540752', hsCodeOrigin: '5407.52', hsCodeDest: '5407.52.00', confidence: 87, mirrorAnalysis: mirrorLow('5407.52','5407.52.00',null,null,'10%'), resultJson: result('Tela poliéster tejida cruda 150cm 200g/m2','540752','5407.52','5407.52.00','CHN','COL','0%','10%','19%',null,null,null), status: 'completed' },
  { id: cid(3,14), userId: USER_IDS.admin_comer_1, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Trajes de baño femeninos con protección UV 50+', originCountry: 'COL', destCountry: 'USA', hsCode: '621121', hsCodeOrigin: '6211.21', hsCodeDest: '6211.21.00', confidence: 91, mirrorAnalysis: mirrorLow('6211.21','6211.21.00','TLC Colombia-USA','0%','24.4%'), resultJson: result('Trajes de baño femeninos protección UV 50+','621121','6211.21','6211.21.00','COL','USA','0%','0%','0%',null,'TLC Colombia-USA','0%'), status: 'completed' },
  { id: cid(3,15), userId: USER_IDS.admin_comer_1, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Tejido de punto interlock 100% algodón, para confección de camisetas', originCountry: 'BRA', destCountry: 'COL', hsCode: '600620', hsCodeOrigin: '6006.20', hsCodeDest: '6006.20.00', confidence: 89, mirrorAnalysis: mirrorLow('6006.20','6006.20.00',null,null,'10%'), resultJson: result('Tejido interlock algodón confección camisetas','600620','6006.20','6006.20.00','BRA','COL','0%','10%','19%',null,null,null), status: 'completed' },

  // admin_comer_2 — 6 clasificaciones (3 image + 3 ocr) — industriales y químicos
  { id: cid(3,16), userId: USER_IDS.admin_comer_2, companyId: COMPANY_IDS.comerexport, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_comer_16.jpg', originCountry: 'DEU', destCountry: 'COL', hsCode: '847989', hsCodeOrigin: '8479.89', hsCodeDest: '8479.89.00', confidence: 84, mirrorAnalysis: mirrorLow('8479.89','8479.89.00','TLC Colombia-UE','0%','5%'), resultJson: result('Máquinas industriales uso especial NCE','847989','8479.89','8479.89.00','DEU','COL','0%','0%','19%',null,'TLC Colombia-UE','0%'), status: 'completed' },
  { id: cid(3,17), userId: USER_IDS.admin_comer_2, companyId: COMPANY_IDS.comerexport, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_comer_17.jpg', originCountry: 'JPN', destCountry: 'COL', hsCode: '841480', hsCodeOrigin: '8414.80', hsCodeDest: '8414.80.00', confidence: 87, mirrorAnalysis: mirrorLow('8414.80','8414.80.00',null,null,'5%'), resultJson: result('Compresores aire acondicionado industrial','841480','8414.80','8414.80.00','JPN','COL','0%','5%','19%',null,null,null), status: 'completed' },
  { id: cid(3,18), userId: USER_IDS.admin_comer_2, companyId: COMPANY_IDS.comerexport, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_comer_18.jpg', originCountry: 'CHN', destCountry: 'MEX', hsCode: '380810', hsCodeOrigin: '3808.10', hsCodeDest: '3808.10.11', confidence: 79, mirrorAnalysis: mirrorMedium('3808.10','3808.10.11','medium',62,'Insecticidas requieren registro sanitario previo COFEPRIS.'), resultJson: result('Insecticidas base química uso agrícola','380810','3808.10','3808.10.11','CHN','MEX','0%','10%','16%',null,null,null), status: 'completed' },
  { id: cid(3,19), userId: USER_IDS.admin_comer_2, companyId: COMPANY_IDS.comerexport, inputType: 'ocr', inputData: 'https://res.cloudinary.com/taricai/seed/factura_comer_19.pdf', originCountry: 'BEL', destCountry: 'COL', hsCode: '290511', hsCodeOrigin: '2905.11', hsCodeDest: '2905.11.00', confidence: 82, mirrorAnalysis: mirrorLow('2905.11','2905.11.00','TLC Colombia-UE','0%','5%'), resultJson: result('Metanol alcohol metílico uso industrial','290511','2905.11','2905.11.00','BEL','COL','0%','5%','19%',null,'TLC Colombia-UE','0%'), status: 'completed' },
  { id: cid(3,20), userId: USER_IDS.admin_comer_2, companyId: COMPANY_IDS.comerexport, inputType: 'ocr', inputData: 'https://res.cloudinary.com/taricai/seed/ficha_comer_20.pdf', originCountry: 'USA', destCountry: 'COL', hsCode: '290810', hsCodeOrigin: '2908.10', hsCodeDest: '2908.10.00', confidence: 77, mirrorAnalysis: mirrorMedium('2908.10','2908.10.00','medium',45,'Derivados halogenados requieren verificación CITES si aplica.'), resultJson: result('Derivados halogenados fenoles uso industrial','290810','2908.10','2908.10.00','USA','COL','0%','5%','19%',null,null,null), status: 'completed' },
  { id: cid(3,21), userId: USER_IDS.admin_comer_2, companyId: COMPANY_IDS.comerexport, inputType: 'ocr', inputData: 'https://res.cloudinary.com/taricai/seed/ficha_comer_21.pdf', originCountry: 'DEU', destCountry: 'BRA', hsCode: '382490', hsCodeOrigin: '3824.90', hsCodeDest: '3824.90.29', confidence: 73, mirrorAnalysis: mirrorMedium('3824.90','3824.90.29','medium',51,'Preparaciones químicas NCE requieren verificar clasificación por composición exacta.'), resultJson: result('Preparaciones químicas industria NCE','382490','3824.90','3824.90.29','DEU','BRA','0%','14%','12%',null,null,null), status: 'completed' },

  // member_comer_1 — 5 text (alimentos y bebidas)
  { id: cid(3,22), userId: USER_IDS.member_comer_1, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Chocolate negro con 72% cacao, tabletas de 100g para consumo', originCountry: 'COL', destCountry: 'FRA', hsCode: '180632', hsCodeOrigin: '1806.32', hsCodeDest: '1806.32.00', confidence: 96, mirrorAnalysis: mirrorLow('1806.32','1806.32.00','TLC Colombia-UE','0%','8%'), resultJson: result('Chocolate negro 72% cacao tabletas 100g','180632','1806.32','1806.32.00','COL','FRA','0%','0%','20%',null,'TLC Colombia-UE','0%'), status: 'completed' },
  { id: cid(3,23), userId: USER_IDS.member_comer_1, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Agua mineral natural sin gas, envase 1.5L PET', originCountry: 'COL', destCountry: 'USA', hsCode: '220110', hsCodeOrigin: '2201.10', hsCodeDest: '2201.10.00', confidence: 99, mirrorAnalysis: mirrorLow('2201.10','2201.10.00','TLC Colombia-USA','0%','0%'), resultJson: result('Agua mineral natural sin gas envase 1.5L','220110','2201.10','2201.10.00','COL','USA','0%','0%','0%',null,'TLC Colombia-USA','0%'), status: 'completed' },
  { id: cid(3,24), userId: USER_IDS.member_comer_1, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Mermelada de mora, azúcar añadida, envase vidrio 250g', originCountry: 'COL', destCountry: 'CAN', hsCode: '200799', hsCodeOrigin: '2007.99', hsCodeDest: '2007.99.00', confidence: 93, mirrorAnalysis: mirrorLow('2007.99','2007.99.00',null,null,'8%'), resultJson: result('Mermelada mora azúcar añadida envase 250g','200799','2007.99','2007.99.00','COL','CAN','0%','8%','5%',null,null,null), status: 'completed' },
  { id: cid(3,25), userId: USER_IDS.member_comer_1, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Ron blanco colombiano 40% vol., botella 750ml', originCountry: 'COL', destCountry: 'GBR', hsCode: '220830', hsCodeOrigin: '2208.30', hsCodeDest: '2208.30.00', confidence: 91, mirrorAnalysis: mirrorLow('2208.30','2208.30.00',null,null,'27.66 GBP/L'), resultJson: result('Ron blanco colombiano 40% vol botella 750ml','220830','2208.30','2208.30.00','COL','GBR','0%','27.66 GBP/L','20%',null,null,null), status: 'completed' },
  { id: cid(3,26), userId: USER_IDS.member_comer_1, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Cacao en polvo sin azúcar para uso industrial alimentario', originCountry: 'COL', destCountry: 'DEU', hsCode: '180500', hsCodeOrigin: '1805.00', hsCodeDest: '1805.00.00', confidence: 98, mirrorAnalysis: mirrorLow('1805.00','1805.00.00','TLC Colombia-UE','0%','8%'), resultJson: result('Cacao en polvo sin azúcar uso industrial','180500','1805.00','1805.00.00','COL','DEU','0%','0%','19%',null,'TLC Colombia-UE','0%'), status: 'completed' },

  // member_comer_2 — 5 text (materias primas agrícolas)
  { id: cid(3,27), userId: USER_IDS.member_comer_2, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Tabaco en rama sin elaborar, variedades Virginia y Burley', originCountry: 'BRA', destCountry: 'DEU', hsCode: '240110', hsCodeOrigin: '2401.10', hsCodeDest: '2401.10.35', confidence: 88, mirrorAnalysis: mirrorLow('2401.10','2401.10.35','TLC Colombia-UE','0%','11.2%'), resultJson: result('Tabaco rama sin elaborar Virginia Burley','240110','2401.10','2401.10.35','BRA','DEU','0%','11.2%','19%',null,null,null), status: 'completed' },
  { id: cid(3,28), userId: USER_IDS.member_comer_2, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Algodón sin cardar ni peinar, fibra natural cruda', originCountry: 'USA', destCountry: 'IND', hsCode: '520100', hsCodeOrigin: '5201.00', hsCodeDest: '5201.00.00', confidence: 99, mirrorAnalysis: mirrorLow('5201.00','5201.00.00',null,null,'5%'), resultJson: result('Algodón sin cardar peinar fibra natural cruda','520100','5201.00','5201.00.00','USA','IND','0%','5%','5%',null,null,null), status: 'completed' },
  { id: cid(3,29), userId: USER_IDS.member_comer_2, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Caucho natural en láminas ahumadas RSS 3', originCountry: 'THA', destCountry: 'DEU', hsCode: '400110', hsCodeOrigin: '4001.10', hsCodeDest: '4001.10.00', confidence: 95, mirrorAnalysis: mirrorLow('4001.10','4001.10.00',null,null,'0%'), resultJson: result('Caucho natural láminas ahumadas RSS3','400110','4001.10','4001.10.00','THA','DEU','0%','0%','19%',null,null,null), status: 'completed' },
  { id: cid(3,30), userId: USER_IDS.member_comer_2, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Madera de pino aserrada, tablones 25mm x 100mm x 3m', originCountry: 'CHL', destCountry: 'COL', hsCode: '440729', hsCodeOrigin: '4407.29', hsCodeDest: '4407.29.00', confidence: 92, mirrorAnalysis: mirrorLow('4407.29','4407.29.00',null,null,'5%'), resultJson: result('Madera pino aserrada tablones 25x100x3000mm','440729','4407.29','4407.29.00','CHL','COL','0%','5%','19%',null,null,null), status: 'completed' },
  { id: cid(3,31), userId: USER_IDS.member_comer_2, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Cuero vacuno curtido al cromo, en plena flor, espesor 1.5mm', originCountry: 'ARG', destCountry: 'ITA', hsCode: '410712', hsCodeOrigin: '4107.12', hsCodeDest: '4107.12.00', confidence: 90, mirrorAnalysis: mirrorLow('4107.12','4107.12.00',null,null,'3%'), resultJson: result('Cuero vacuno curtido cromo plena flor 1.5mm','410712','4107.12','4107.12.00','ARG','ITA','0%','3%','22%',null,null,null), status: 'completed' },

  // member_comer_3 — 4 image (electrónica de consumo)
  { id: cid(3,32), userId: USER_IDS.member_comer_3, companyId: COMPANY_IDS.comerexport, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_comer_32.jpg', originCountry: 'CHN', destCountry: 'COL', hsCode: '851650', hsCodeOrigin: '8516.50', hsCodeDest: '8516.50.00', confidence: 85, mirrorAnalysis: mirrorLow('8516.50','8516.50.00',null,null,'10%'), resultJson: result('Hornos microondas uso doméstico 800W','851650','8516.50','8516.50.00','CHN','COL','0%','10%','19%',null,null,null), status: 'completed' },
  { id: cid(3,33), userId: USER_IDS.member_comer_3, companyId: COMPANY_IDS.comerexport, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_comer_33.jpg', originCountry: 'KOR', destCountry: 'MEX', hsCode: '851671', hsCodeOrigin: '8516.71', hsCodeDest: '8516.71.00', confidence: 88, mirrorAnalysis: mirrorLow('8516.71','8516.71.00',null,null,'20%'), resultJson: result('Máquinas para preparar café espresso automáticas','851671','8516.71','8516.71.00','KOR','MEX','0%','20%','16%',null,null,null), status: 'completed' },
  { id: cid(3,34), userId: USER_IDS.member_comer_3, companyId: COMPANY_IDS.comerexport, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_comer_34.jpg', originCountry: 'TWN', destCountry: 'COL', hsCode: '847321', hsCodeOrigin: '8473.21', hsCodeDest: '8473.21.00', confidence: 83, mirrorAnalysis: mirrorMedium('8473.21','8473.21.00','medium',40,'Partes de máquina deben identificarse por la máquina principal para clasificación correcta.'), resultJson: result('Partes accesorios máquinas procesamiento datos','847321','8473.21','8473.21.00','TWN','COL','0%','5%','19%',null,null,null), status: 'completed' },
  { id: cid(3,35), userId: USER_IDS.member_comer_3, companyId: COMPANY_IDS.comerexport, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_comer_35.jpg', originCountry: 'CHN', destCountry: 'ARG', hsCode: '852872', hsCodeOrigin: '8528.72', hsCodeDest: '8528.72.00', confidence: 87, mirrorAnalysis: mirrorLow('8528.72','8528.72.00',null,null,'35%'), resultJson: result('Monitores LCD color 27 pulgadas uso profesional','852872','8528.72','8528.72.00','CHN','ARG','0%','35%','21%',null,null,null), status: 'completed' },

  // member_comer_4 — 5 text (cosméticos y cuidado personal)
  { id: cid(3,36), userId: USER_IDS.member_comer_4, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Crema hidratante facial con ácido hialurónico y SPF 30', originCountry: 'COL', destCountry: 'ESP', hsCode: '330499', hsCodeOrigin: '3304.99', hsCodeDest: '3304.99.00', confidence: 91, mirrorAnalysis: mirrorLow('3304.99','3304.99.00','TLC Colombia-UE','0%','0%'), resultJson: result('Crema hidratante facial ácido hialurónico SPF30','330499','3304.99','3304.99.00','COL','ESP','0%','0%','21%',null,'TLC Colombia-UE','0%'), status: 'completed' },
  { id: cid(3,37), userId: USER_IDS.member_comer_4, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Champú anticaspa con piritionato de zinc 1%', originCountry: 'COL', destCountry: 'USA', hsCode: '330510', hsCodeOrigin: '3305.10', hsCodeDest: '3305.10.00', confidence: 94, mirrorAnalysis: mirrorLow('3305.10','3305.10.00','TLC Colombia-USA','0%','0%'), resultJson: result('Champú anticaspa piritionato zinc 1%','330510','3305.10','3305.10.00','COL','USA','0%','0%','0%',null,'TLC Colombia-USA','0%'), status: 'completed' },
  { id: cid(3,38), userId: USER_IDS.member_comer_4, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Perfume de mujer, extracto de perfumería 30ml, frasco vidrio', originCountry: 'FRA', destCountry: 'COL', hsCode: '330111', hsCodeOrigin: '3301.11', hsCodeDest: '3301.11.00', confidence: 89, mirrorAnalysis: mirrorLow('3301.11','3301.11.00','TLC Colombia-UE','0%','15%'), resultJson: result('Perfume mujer extracto perfumería 30ml','330111','3301.11','3301.11.00','FRA','COL','0%','0%','19%',null,'TLC Colombia-UE','0%'), status: 'completed' },
  { id: cid(3,39), userId: USER_IDS.member_comer_4, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Protector solar corporal SPF 50+ waterproof, 200ml', originCountry: 'COL', destCountry: 'CAN', hsCode: '330499', hsCodeOrigin: '3304.99', hsCodeDest: '3304.99.00', confidence: 90, mirrorAnalysis: mirrorLow('3304.99','3304.99.00',null,null,'0%'), resultJson: result('Protector solar corporal SPF50+ waterproof 200ml','330499','3304.99','3304.99.00','COL','CAN','0%','0%','13%',null,null,null), status: 'completed' },
  { id: cid(3,40), userId: USER_IDS.member_comer_4, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Desodorante roll-on alumbre natural 50ml', originCountry: 'COL', destCountry: 'DEU', hsCode: '330720', hsCodeOrigin: '3307.20', hsCodeDest: '3307.20.00', confidence: 93, mirrorAnalysis: mirrorLow('3307.20','3307.20.00','TLC Colombia-UE','0%','6.5%'), resultJson: result('Desodorante roll-on alumbre natural 50ml','330720','3307.20','3307.20.00','COL','DEU','0%','0%','19%',null,'TLC Colombia-UE','0%'), status: 'completed' },

  // member_comer_5 — 5 text (maquinaria y repuestos)
  { id: cid(3,41), userId: USER_IDS.member_comer_5, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Tornos CNC para metales, control numérico, diámetro hasta 300mm', originCountry: 'JPN', destCountry: 'COL', hsCode: '845811', hsCodeOrigin: '8458.11', hsCodeDest: '8458.11.00', confidence: 88, mirrorAnalysis: mirrorLow('8458.11','8458.11.00',null,null,'0%'), resultJson: result('Tornos CNC metales control numérico 300mm','845811','8458.11','8458.11.00','JPN','COL','0%','0%','0%',null,null,null), status: 'completed' },
  { id: cid(3,42), userId: USER_IDS.member_comer_5, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Rodamientos de bolas de acero cromado, diámetro exterior 62mm', originCountry: 'DEU', destCountry: 'COL', hsCode: '848210', hsCodeOrigin: '8482.10', hsCodeDest: '8482.10.10', confidence: 92, mirrorAnalysis: mirrorLow('8482.10','8482.10.10','TLC Colombia-UE','0%','5%'), resultJson: result('Rodamientos bolas acero cromado 62mm exterior','848210','8482.10','8482.10.10','DEU','COL','0%','0%','19%',null,'TLC Colombia-UE','0%'), status: 'completed' },
  { id: cid(3,43), userId: USER_IDS.member_comer_5, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Bombas centrífugas para agua, caudal 500 L/min, uso industrial', originCountry: 'ITA', destCountry: 'COL', hsCode: '841370', hsCodeOrigin: '8413.70', hsCodeDest: '8413.70.00', confidence: 86, mirrorAnalysis: mirrorLow('8413.70','8413.70.00','TLC Colombia-UE','0%','5%'), resultJson: result('Bombas centrífugas agua 500L/min industrial','841370','8413.70','8413.70.00','ITA','COL','0%','0%','0%',null,'TLC Colombia-UE','0%'), status: 'completed' },
  { id: cid(3,44), userId: USER_IDS.member_comer_5, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Filtros de aceite para motores diésel industriales', originCountry: 'DEU', destCountry: 'COL', hsCode: '842131', hsCodeOrigin: '8421.31', hsCodeDest: '8421.31.00', confidence: 90, mirrorAnalysis: mirrorLow('8421.31','8421.31.00','TLC Colombia-UE','0%','5%'), resultJson: result('Filtros aceite motores diésel industriales','842131','8421.31','8421.31.00','DEU','COL','0%','0%','19%',null,'TLC Colombia-UE','0%'), status: 'completed' },
  { id: cid(3,45), userId: USER_IDS.member_comer_5, companyId: COMPANY_IDS.comerexport, inputType: 'text', inputData: 'Válvulas de control neumático para automatización industrial', originCountry: 'CHE', destCountry: 'COL', hsCode: '848190', hsCodeOrigin: '8481.90', hsCodeDest: '8481.90.00', confidence: 85, mirrorAnalysis: mirrorLow('8481.90','8481.90.00',null,null,'5%'), resultJson: result('Válvulas control neumático automatización industrial','848190','8481.90','8481.90.00','CHE','COL','0%','5%','19%',null,null,null), status: 'completed' },
];

// ─── Empresa 4: Adriatica Imports EU — Team past_due (10 clasificaciones) ──────
// createdAt anterior al vencimiento — creadas cuando el plan estaba activo

const ADRIATICA = [
  { id: cid(4,1), userId: USER_IDS.owner_adriatica, companyId: COMPANY_IDS.adriatica, inputType: 'text', inputData: 'Maquinaria para procesamiento de alimentos, acero inoxidable', originCountry: 'ITA', destCountry: 'DEU', hsCode: '843880', hsCodeOrigin: '8438.80', hsCodeDest: '8438.80.00', confidence: 91, mirrorAnalysis: mirrorLow('8438.80','8438.80.00',null,null,'0%'), resultJson: result('Maquinaria procesamiento alimentos acero inoxidable','843880','8438.80','8438.80.00','ITA','DEU','0%','0%','19%',null,null,null), status: 'completed', createdAt: getAdriatikaClassificationDate(2) },
  { id: cid(4,2), userId: USER_IDS.owner_adriatica, companyId: COMPANY_IDS.adriatica, inputType: 'text', inputData: 'Aceite de oliva virgen extra, embotellado 500ml', originCountry: 'ITA', destCountry: 'FRA', hsCode: '150910', hsCodeOrigin: '1509.10', hsCodeDest: '1509.10.90', confidence: 96, mirrorAnalysis: mirrorLow('1509.10','1509.10.90',null,null,'7.5%'), resultJson: result('Aceite oliva virgen extra embotellado 500ml','150910','1509.10','1509.10.90','ITA','FRA','0%','7.5%','20%',null,null,null), status: 'completed', createdAt: getAdriatikaClassificationDate(5) },
  { id: cid(4,3), userId: USER_IDS.owner_adriatica, companyId: COMPANY_IDS.adriatica, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_adria_03.jpg', originCountry: 'DEU', destCountry: 'ITA', hsCode: '841810', hsCodeOrigin: '8418.10', hsCodeDest: '8418.10.20', confidence: 88, mirrorAnalysis: mirrorLow('8418.10','8418.10.20',null,null,'0%'), resultJson: result('Combinados frigorífico-congelador uso doméstico','841810','8418.10','8418.10.20','DEU','ITA','0%','0%','22%',null,null,null), status: 'completed', createdAt: getAdriatikaClassificationDate(8) },
  { id: cid(4,4), userId: USER_IDS.admin_adriatica, companyId: COMPANY_IDS.adriatica, inputType: 'text', inputData: 'Productos cerámicos sanitarios para baño', originCountry: 'ITA', destCountry: 'POL', hsCode: '691010', hsCodeOrigin: '6910.10', hsCodeDest: '6910.10.00', confidence: 87, mirrorAnalysis: mirrorLow('6910.10','6910.10.00',null,null,'5.1%'), resultJson: result('Productos cerámicos sanitarios baño inodoros lavabos','691010','6910.10','6910.10.00','ITA','POL','0%','5.1%','23%',null,null,null), status: 'completed', createdAt: getAdriatikaClassificationDate(10) },
  { id: cid(4,5), userId: USER_IDS.admin_adriatica, companyId: COMPANY_IDS.adriatica, inputType: 'ocr', inputData: 'https://res.cloudinary.com/taricai/seed/factura_adria_05.pdf', originCountry: 'FRA', destCountry: 'ITA', hsCode: '330300', hsCodeOrigin: '3303.00', hsCodeDest: '3303.00.90', confidence: 79, mirrorAnalysis: mirrorMedium('3303.00','3303.00.90','medium',33,'Perfumes requieren notificación CPNP si se comercializan en UE.'), resultJson: result('Perfumes aguas de tocador perfumería Francia','330300','3303.00','3303.00.90','FRA','ITA','0%','0%','22%',null,null,null), status: 'completed', createdAt: getAdriatikaClassificationDate(12) },
  { id: cid(4,6), userId: USER_IDS.admin_adriatica, companyId: COMPANY_IDS.adriatica, inputType: 'text', inputData: 'Autopartes: catalizadores de gases de escape', originCountry: 'DEU', destCountry: 'CZE', hsCode: '870892', hsCodeOrigin: '8708.92', hsCodeDest: '8708.92.20', confidence: 85, mirrorAnalysis: mirrorLow('8708.92','8708.92.20',null,null,'3.5%'), resultJson: result('Catalizadores gases escape automotrices','870892','8708.92','8708.92.20','DEU','CZE','0%','3.5%','21%',null,null,null), status: 'completed', createdAt: getAdriatikaClassificationDate(14) },
  { id: cid(4,7), userId: USER_IDS.member_adria_1, companyId: COMPANY_IDS.adriatica, inputType: 'text', inputData: 'Instrumentos de medición de temperatura industrial', originCountry: 'CHE', destCountry: 'ITA', hsCode: '902519', hsCodeOrigin: '9025.19', hsCodeDest: '9025.19.80', confidence: 90, mirrorAnalysis: mirrorLow('9025.19','9025.19.80',null,null,'1.7%'), resultJson: result('Instrumentos medición temperatura industrial','902519','9025.19','9025.19.80','CHE','ITA','0%','1.7%','22%',null,null,null), status: 'completed', createdAt: getAdriatikaClassificationDate(16) },
  { id: cid(4,8), userId: USER_IDS.member_adria_1, companyId: COMPANY_IDS.adriatica, inputType: 'text', inputData: 'Cables eléctricos de cobre, sección > 1mm², aislados PVC', originCountry: 'DEU', destCountry: 'ITA', hsCode: '854442', hsCodeOrigin: '8544.42', hsCodeDest: '8544.42.90', confidence: 93, mirrorAnalysis: mirrorLow('8544.42','8544.42.90',null,null,'2.7%'), resultJson: result('Cables eléctricos cobre sección >1mm² aislados PVC','854442','8544.42','8544.42.90','DEU','ITA','0%','2.7%','22%',null,null,null), status: 'completed', createdAt: getAdriatikaClassificationDate(18) },
  { id: cid(4,9), userId: USER_IDS.member_adria_2, companyId: COMPANY_IDS.adriatica, inputType: 'text', inputData: 'Embalajes de plástico, cajas para transporte de frutas', originCountry: 'ITA', destCountry: 'ESP', hsCode: '392310', hsCodeOrigin: '3923.10', hsCodeDest: '3923.10.10', confidence: 82, mirrorAnalysis: mirrorLow('3923.10','3923.10.10',null,null,'6.5%'), resultJson: result('Embalajes plástico cajas transporte frutas','392310','3923.10','3923.10.10','ITA','ESP','0%','6.5%','21%',null,null,null), status: 'completed', createdAt: getAdriatikaClassificationDate(20) },
  { id: cid(4,10), userId: USER_IDS.member_adria_2, companyId: COMPANY_IDS.adriatica, inputType: 'image', inputData: 'https://res.cloudinary.com/taricai/seed/clasificacion_adria_10.jpg', originCountry: 'NLD', destCountry: 'ITA', hsCode: '290511', hsCodeOrigin: '2905.11', hsCodeDest: '2905.11.00', confidence: 77, mirrorAnalysis: mirrorMedium('2905.11','2905.11.00','medium',44,'Alcoholes industriales requieren verificación uso final para determinar exención de impuestos especiales.'), resultJson: result('Metanol alcohol metílico uso industrial químico','290511','2905.11','2905.11.00','NLD','ITA','0%','0%','22%',null,null,null), status: 'completed', createdAt: getAdriatikaClassificationDate(22) },
];

// ─── Empresa 5: Nexus Enterprise Corp — Enterprise (80 clasificaciones) ─────────

const NEXUS_TEXT_PRODUCTS = [
  // owner_nexus — 14 clasificaciones (8 text + 3 image + 3 ocr)
  ['870323','Automóviles turismo cilindrada 1500-3000cc','CHN','USA','8703.23','8703.23.01'],
  ['854231','Circuitos integrados monolíticos digitales memorias DRAM','KOR','DEU','8542.31','8542.31.90'],
  ['300210','Vacunas humanas contra virus influenza estacional','USA','BRA','3002.10','3002.10.91'],
  ['760110','Aluminio en bruto sin alear lingotes fundición','AUS','CHN','7601.10','7601.10.10'],
  ['271121','Gas natural estado gaseoso comercialización','NOR','DEU','2711.21','2711.21.00'],
  ['880240','Aeronaves peso vacío superior 15000kg aerolíneas','USA','SGP','8802.40','8802.40.00'],
  ['854411','Cables eléctricos cobre aislados alta tensión 400kV','DEU','BRA','8544.11','8544.11.90'],
  ['290121','Etileno para síntesis química industria petroquímica','USA','KOR','2901.21','2901.21.00'],
  // admin_nexus_1 — 14 (7 text + 4 image + 3 ocr)
  ['870431','Camiones mercancía motor diésel tonelaje 5-20t','DEU','BRA','8704.31','8704.31.10'],
  ['840810','Motores diesel potencia >200kW uso naval industrial','FIN','SGP','8408.10','8408.10.91'],
  ['392321','Sacos bolsas plástico PEBD uso empaque industrial','CHN','COL','3923.21','3923.21.00'],
  ['903289','Instrumentos regulación control automático proceso','JPN','MEX','9032.89','9032.89.00'],
  ['270900','Petróleo crudo extracción subsuelo marino','NOR','NLD','2709.00','2709.00.10'],
  ['844399','Partes accesorios máquinas impresión offset digital','DEU','COL','8443.99','8443.99.00'],
  ['740811','Alambre cobre refinado sección circular >6mm','CHN','DEU','7408.11','7408.11.00'],
  // admin_nexus_2 — 13 (7 text + 3 image + 3 ocr)
  ['850440','Convertidores estáticos electrónica de potencia UPS','CHN','BRA','8504.40','8504.40.88'],
  ['870120','Tractores carretera semirremolque camiones articulados','DEU','BRA','8701.20','8701.20.10'],
  ['292249','Aminoácidos lisina metionina uso nutrición animal','CHN','USA','2922.49','2922.49.85'],
  ['391510','Residuos desperdicios chatarra polímeros etileno','DEU','CHN','3915.10','3915.10.00'],
  ['841490','Partes compresores bombas vacío industriales','JPN','COL','8414.90','8414.90.90'],
  ['903120','Bancos prueba motores análisis comportamiento','DEU','MEX','9031.20','9031.20.00'],
  ['870600','Chasis motor vehículos industriales camionetas','MEX','USA','8706.00','8706.00.11'],
  // member_nexus_1 — 13 (7 text + 3 image + 3 ocr)
  ['292690','Nitrilos derivados nitrílicos síntesis química','USA','CHN','2926.90','2926.90.95'],
  ['380130','Pasta de carbono electrodos hornos eléctricos','NOR','IND','3801.30','3801.30.00'],
  ['854810','Partes eléctricas máquinas aparatos NCE','JPN','COL','8548.10','8548.10.10'],
  ['210320','Kétchup salsas tomate preparaciones alimenticias','USA','COL','2103.20','2103.20.00'],
  ['490110','Libros publicaciones impresas uso educativo','USA','COL','4901.10','4901.10.00'],
  ['560311','Telas no tejidas polipropileno peso ≤25g/m2','CHN','COL','5603.11','5603.11.10'],
  ['841350','Bombas dosificadoras industria química farmacéutica','DEU','COL','8413.50','8413.50.61'],
  // member_nexus_2 — 13 (7 text + 3 image + 3 ocr)
  ['310210','Urea gránulos fertilizante nitrogenado agricultura','RUS','BRA','3102.10','3102.10.10'],
  ['852580','Cámaras televisión circuito cerrado seguridad','CHN','COL','8525.80','8525.80.30'],
  ['870829','Partes carrocerías automóviles puertas paneles','MEX','USA','8708.29','8708.29.10'],
  ['392020','Láminas PVC rígido uso industrial termoformado','DEU','COL','3920.20','3920.20.19'],
  ['842230','Máquinas llenar cerrar sellar recipientes bebidas','ITA','COL','8422.30','8422.30.00'],
  ['901380','Cristales líquidos dispositivos LCD pantallas','JPN','KOR','9013.80','9013.80.90'],
  ['870840','Cajas cambios transmisiones automáticas vehículos','DEU','COL','8708.40','8708.40.91'],
  // member_nexus_3 — 13 (7 text + 3 image + 3 ocr)
  ['820390','Herramientas manuales uso industrial NCE pinzas','DEU','COL','8203.90','8203.90.00'],
  ['850164','Generadores síncronos potencia >750 kVA','JPN','IND','8501.64','8501.64.00'],
  ['870850','Ejes transmisión diferenciales vehículos tracción','DEU','MEX','8708.50','8708.50.91'],
  ['392010','Placas láminas polímeros etileno uso embalaje','CHN','BRA','3920.10','3920.10.10'],
  ['848180','Grifos válvulas regulación caudal industria','ITA','COL','8481.80','8481.80.39'],
  ['841229','Motores hidráulicos cilindros accionamiento lineal','DEU','BRA','8412.29','8412.29.80'],
  ['870899','Partes accesorios vehículos automóviles NCE','CHN','USA','8708.99','8708.99.97'],
];

// Build Nexus text classifications (40 text)
const nexusTextClassifs = NEXUS_TEXT_PRODUCTS.map((p, i) => {
  const [hsCode, inputData, originCountry, destCountry, hsOrigin, hsDest] = p;
  const conf = 82 + Math.floor((i * 7) % 18);
  // 3 con discrepancyLevel: 'critical' — para testing alertas críticas (índices 3, 15, 27)
  const isCritical = [3, 15, 27].includes(i);
  const userId = [
    USER_IDS.owner_nexus, USER_IDS.owner_nexus, USER_IDS.owner_nexus, USER_IDS.owner_nexus,
    USER_IDS.owner_nexus, USER_IDS.owner_nexus, USER_IDS.owner_nexus, USER_IDS.owner_nexus,
    USER_IDS.admin_nexus_1, USER_IDS.admin_nexus_1, USER_IDS.admin_nexus_1, USER_IDS.admin_nexus_1,
    USER_IDS.admin_nexus_1, USER_IDS.admin_nexus_1, USER_IDS.admin_nexus_1,
    USER_IDS.admin_nexus_2, USER_IDS.admin_nexus_2, USER_IDS.admin_nexus_2, USER_IDS.admin_nexus_2,
    USER_IDS.admin_nexus_2, USER_IDS.admin_nexus_2, USER_IDS.admin_nexus_2,
    USER_IDS.member_nexus_1, USER_IDS.member_nexus_1, USER_IDS.member_nexus_1, USER_IDS.member_nexus_1,
    USER_IDS.member_nexus_1, USER_IDS.member_nexus_1, USER_IDS.member_nexus_1,
    USER_IDS.member_nexus_2, USER_IDS.member_nexus_2, USER_IDS.member_nexus_2, USER_IDS.member_nexus_2,
    USER_IDS.member_nexus_2, USER_IDS.member_nexus_2, USER_IDS.member_nexus_2,
    USER_IDS.member_nexus_3, USER_IDS.member_nexus_3, USER_IDS.member_nexus_3, USER_IDS.member_nexus_3,
    USER_IDS.member_nexus_3, USER_IDS.member_nexus_3, USER_IDS.member_nexus_3,
  ][i];
  const isAntidumping = i === 27;
  const isDualUse = i === 15;
  return {
    id: cid(5, i + 1),
    userId,
    companyId: COMPANY_IDS.nexus,
    inputType: 'text',
    inputData,
    originCountry,
    destCountry,
    hsCode,
    hsCodeOrigin: hsOrigin,
    hsCodeDest: hsDest,
    confidence: conf,
    mirrorAnalysis: isCritical
      ? mirrorCritical(hsOrigin, hsDest, isAntidumping
          ? [{ type: 'antidumping', description: 'Medida antidumping vigente — verificar reglamentos aplicables en país destino.' }]
          : isDualUse
          ? [{ type: 'dual_use', description: 'Bien de doble uso — requiere licencia de exportación EAR/ITAR o equivalente nacional.' }]
          : [{ type: 'license', description: 'Requiere licencia previa de importación en país destino.' }])
      : mirrorLow(hsOrigin, hsDest, null, null, '5%'),
    resultJson: result(inputData, hsCode, hsOrigin, hsDest, originCountry, destCountry, '0%', '5%', '19%', null, null, null),
    status: 'completed',
  };
});

// Build Nexus image classifications (25 image, IDs 44-68)
const NEXUS_IMAGE_URLS = Array.from({ length: 25 }, (_, i) => `https://res.cloudinary.com/taricai/seed/clasificacion_nexus_img_${String(i + 1).padStart(2, '0')}.jpg`);
const NEXUS_IMAGE_USERS = [
  ...Array(5).fill(USER_IDS.owner_nexus),
  ...Array(4).fill(USER_IDS.admin_nexus_1),
  ...Array(4).fill(USER_IDS.admin_nexus_2),
  ...Array(4).fill(USER_IDS.member_nexus_1),
  ...Array(4).fill(USER_IDS.member_nexus_2),
  ...Array(4).fill(USER_IDS.member_nexus_3),
];
const NEXUS_IMAGE_HS = ['847160','851762','903149','840290','850440','854231','870323','841480','842139','903289','730110','760612','680299','401120','392321','870110','391510','841370','292249','848210','870431','840810','271121','382490','292690'];
const NEXUS_IMAGE_OC = ['CHN','USA','KOR','DEU','JPN','CHN','DEU','JPN','ITA','JPN','DEU','CHN','BRA','THA','CHN','DEU','DEU','ITA','CHN','DEU','DEU','FIN','NOR','DEU','USA'];
const NEXUS_IMAGE_DC = ['COL','DEU','USA','BRA','COL','DEU','USA','COL','BRA','MEX','COL','BRA','COL','DEU','COL','BRA','CHN','COL','USA','COL','BRA','SGP','NLD','COL','CHN'];
const nexusImageClassifs = NEXUS_IMAGE_URLS.map((url, i) => ({
  id: cid(5, 44 + i),
  userId: NEXUS_IMAGE_USERS[i],
  companyId: COMPANY_IDS.nexus,
  inputType: 'image',
  inputData: url,
  originCountry: NEXUS_IMAGE_OC[i],
  destCountry: NEXUS_IMAGE_DC[i],
  hsCode: NEXUS_IMAGE_HS[i],
  hsCodeOrigin: `${NEXUS_IMAGE_HS[i].slice(0,4)}.${NEXUS_IMAGE_HS[i].slice(4)}`,
  hsCodeDest: `${NEXUS_IMAGE_HS[i].slice(0,4)}.${NEXUS_IMAGE_HS[i].slice(4)}.00`,
  confidence: 83 + Math.floor((i * 5) % 16),
  mirrorAnalysis: mirrorLow(`${NEXUS_IMAGE_HS[i].slice(0,4)}.${NEXUS_IMAGE_HS[i].slice(4)}`, `${NEXUS_IMAGE_HS[i].slice(0,4)}.${NEXUS_IMAGE_HS[i].slice(4)}.00`, null, null, '5%'),
  resultJson: result(`Producto clasificado por imagen ${i + 1}`, NEXUS_IMAGE_HS[i], `${NEXUS_IMAGE_HS[i].slice(0,4)}.${NEXUS_IMAGE_HS[i].slice(4)}`, `${NEXUS_IMAGE_HS[i].slice(0,4)}.${NEXUS_IMAGE_HS[i].slice(4)}.00`, NEXUS_IMAGE_OC[i], NEXUS_IMAGE_DC[i], '0%', '5%', '19%', null, null, null),
  status: 'completed',
}));

// Build Nexus OCR classifications (15 ocr, IDs 69-83)
const NEXUS_OCR_URLS = Array.from({ length: 15 }, (_, i) => `https://res.cloudinary.com/taricai/seed/factura_nexus_ocr_${String(i + 1).padStart(2, '0')}.pdf`);
const NEXUS_OCR_USERS = [
  ...Array(3).fill(USER_IDS.owner_nexus),
  ...Array(3).fill(USER_IDS.admin_nexus_1),
  ...Array(3).fill(USER_IDS.admin_nexus_2),
  ...Array(3).fill(USER_IDS.member_nexus_1),
  ...Array(2).fill(USER_IDS.member_nexus_2),
  ...Array(1).fill(USER_IDS.member_nexus_3),
];
const NEXUS_OCR_HS = ['300390','293499','380830','382460','230990','300490','292249','382490','310310','391590','293359','300590','382319','292250','580520'];
const NEXUS_OCR_OC = ['USA','CHN','DEU','CHN','BRA','USA','CHN','DEU','MAR','DEU','CHN','USA','DEU','CHN','IND'];
const NEXUS_OCR_DC = ['COL','USA','BRA','MEX','COL','BRA','USA','COL','BRA','CHN','COL','MEX','BRA','COL','USA'];
const nexusOcrClassifs = NEXUS_OCR_URLS.map((url, i) => ({
  id: cid(5, 69 + i),
  userId: NEXUS_OCR_USERS[i],
  companyId: COMPANY_IDS.nexus,
  inputType: 'ocr',
  inputData: url,
  originCountry: NEXUS_OCR_OC[i],
  destCountry: NEXUS_OCR_DC[i],
  hsCode: NEXUS_OCR_HS[i],
  hsCodeOrigin: `${NEXUS_OCR_HS[i].slice(0,4)}.${NEXUS_OCR_HS[i].slice(4)}`,
  hsCodeDest: `${NEXUS_OCR_HS[i].slice(0,4)}.${NEXUS_OCR_HS[i].slice(4)}.00`,
  confidence: 82 + Math.floor((i * 4) % 17),
  mirrorAnalysis: mirrorLow(`${NEXUS_OCR_HS[i].slice(0,4)}.${NEXUS_OCR_HS[i].slice(4)}`, `${NEXUS_OCR_HS[i].slice(0,4)}.${NEXUS_OCR_HS[i].slice(4)}.00`, null, null, '5%'),
  resultJson: result(`Producto clasificado por OCR documento ${i + 1}`, NEXUS_OCR_HS[i], `${NEXUS_OCR_HS[i].slice(0,4)}.${NEXUS_OCR_HS[i].slice(4)}`, `${NEXUS_OCR_HS[i].slice(0,4)}.${NEXUS_OCR_HS[i].slice(4)}.00`, NEXUS_OCR_OC[i], NEXUS_OCR_DC[i], '0%', '5%', '19%', null, null, null),
  status: 'completed',
}));

const NEXUS = [...nexusTextClassifs, ...nexusImageClassifs, ...nexusOcrClassifs];

const CLASSIFICATIONS = [...ANDINA, ...GLOBALTRADE, ...COMEREXPORT, ...ADRIATICA, ...NEXUS];

module.exports = { CLASSIFICATIONS };
