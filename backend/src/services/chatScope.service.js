const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GUARD_MODEL = process.env.CHAT_GUARD_MODEL || 'gpt-4o-mini';

/**
 * @description Valida scope + clasifica queryType + extrae países en UNA sola llamada a gpt-4o-mini.
 * Ahorro del 30% en costo vs 2 llamadas separadas (~220 tokens mini total).
 * @param {string} message - Texto del mensaje del usuario
 * @returns {Promise<{ scope: 'IN_SCOPE'|'OUT_OF_SCOPE', queryType: string, countries: string[] }>}
 */
async function validateAndClassify(message) {
  const prompt = `Analiza el mensaje y responde SOLO con JSON válido sin markdown ni backticks:
{
  "scope": "IN_SCOPE" | "OUT_OF_SCOPE",
  "queryType": "tariff"|"treaty"|"incoterms"|"logistics"|"geopolitical"|"market_research"|"customs_procedure"|"regulatory"|"sanctions"|"valuation"|"negotiation"|"contract"|"legal"|"transport_law"|"transfer_pricing"|"general"|"out_of_scope",
  "countries": ["ISO3"]
}

IN_SCOPE si el mensaje trata sobre: comercio exterior, aduanas, aranceles, incoterms, tratados, reglas de origen, valoración aduanera, logística internacional, documentación aduanera, barreras no arancelarias, negociación comercial, regulaciones importación/exportación, clasificación HS, regímenes aduaneros, zonas francas, drawback, controles exportación, sanciones internacionales, geopolítica y comercio, conflictos e impacto en cadenas de suministro, seguros de carga, derecho mercantil internacional, métodos de pago internacional, financiamiento comercio exterior, inteligencia comercial internacional, contratos internacionales, precios de transferencia.

OUT_OF_SCOPE si NO está relacionado con ninguno de los anteriores.

queryType: el tipo MÁS específico que aplica al mensaje. Si es out_of_scope usar "out_of_scope".
countries: hasta 5 países ISO alpha-3 mencionados explícitamente (array vacío si ninguno).

Mensaje: "${message.replace(/"/g, "'")}"`;

  const response = await openai.chat.completions.create({
    model: GUARD_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
    max_tokens: 80,
  });

  try {
    return JSON.parse(response.choices[0].message.content.trim());
  } catch {
    // Si el JSON falla, asumir IN_SCOPE con tipo general para no rechazar consultas válidas
    return { scope: 'IN_SCOPE', queryType: 'general', countries: [] };
  }
}

/**
 * @description Genera el mensaje de restricción de dominio en el idioma del usuario.
 * Respuesta estática — no consume GPT-4o.
 * @param {string} languageName - Nombre del idioma del usuario (ej: 'español')
 * @param {string} languageCode - ISO 639-1 del idioma del usuario
 * @returns {string} - Mensaje de restricción listo para enviar al frontend
 */
function getOutOfScopeMessage(languageName, languageCode) {
  const messages = {
    es: 'Gracias por tu consulta. Soy el Chat de IA especializado de Taric AI en comercio exterior, aduanas, aranceles, tratados comerciales, contratos y derecho mercantil internacional, negociación, geopolítica comercial e inteligencia de mercado internacional. Para ofrecerte el mayor valor posible, estoy enfocado exclusivamente en estas áreas de expertise.\n\n¿Puedo ayudarte con clasificación arancelaria, operaciones aduaneras, tratados comerciales, contratos internacionales, el impacto de sanciones o conflictos en tu cadena de suministro, o inteligencia comercial?',
    en: 'Thank you for your query. I am the specialized AI Chat of Taric AI, focused on international trade, customs, tariffs, trade agreements, contracts, international commercial law, negotiation, commercial geopolitics, and international market intelligence. To provide you the most value, I am exclusively focused on these areas of expertise.\n\nCan I help you with tariff classification, customs operations, trade agreements, international contracts, the impact of sanctions or conflicts on your supply chain, or commercial intelligence?',
    pt: 'Obrigado pela sua consulta. Sou o Chat de IA especializado da Taric AI em comércio exterior, alfândega, tarifas, acordos comerciais, contratos e direito comercial internacional, negociação, geopolítica comercial e inteligência de mercado internacional. Para oferecer o máximo valor, estou focado exclusivamente nessas áreas de expertise.\n\nPosso ajudá-lo com classificação tarifária, operações aduaneiras, acordos comerciais, contratos internacionais, o impacto de sanções ou conflitos na sua cadeia de suprimentos, ou inteligência comercial?',
    fr: "Merci pour votre question. Je suis le Chat IA spécialisé de Taric AI dans le commerce extérieur, la douane, les droits de douane, les accords commerciaux, les contrats et le droit commercial international, la négociation, la géopolitique commerciale et l'intelligence de marché internationale. Pour vous offrir le maximum de valeur, je suis exclusivement focalisé sur ces domaines d'expertise.\n\nPuis-je vous aider avec la classification tarifaire, les opérations douanières, les accords commerciaux, les contrats internationaux, l'impact des sanctions ou des conflits sur votre chaîne d'approvisionnement, ou l'intelligence commerciale?",
    ar: 'شكراً على استفسارك. أنا محادثة الذكاء الاصطناعي المتخصصة من Taric AI في التجارة الخارجية والجمارك والرسوم الجمركية والاتفاقيات التجارية والعقود والقانون التجاري الدولي والتفاوض والجيوسياسية التجارية وذكاء السوق الدولي. لتقديم أقصى قيمة لك، أركز حصرياً على هذه المجالات من الخبرة.\n\nهل يمكنني مساعدتك في التصنيف الجمركي أو العمليات الجمركية أو الاتفاقيات التجارية أو العقود الدولية أو تأثير العقوبات أو النزاعات على سلسلة التوريد أو الذكاء التجاري؟',
    zh: '感谢您的咨询。我是Taric AI专业AI聊天助手，专注于对外贸易、海关、关税、贸易协定、合同和国际商法、谈判、商业地缘政治和国际市场情报。为了为您提供最大价值，我专门专注于这些专业领域。\n\n我可以帮助您处理关税分类、海关操作、贸易协定、国际合同、制裁或冲突对供应链的影响，或商业情报吗？',
  };

  return messages[languageCode] || messages.en;
}

module.exports = { validateAndClassify, getOutOfScopeMessage };
