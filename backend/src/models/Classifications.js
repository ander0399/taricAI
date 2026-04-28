const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @description Historial de clasificaciones arancelarias IA por usuario/empresa.
 * Cada registro representa una solicitud de clasificación completa incluyendo
 * el resultado de OpenAI, análisis espejo y metadatos de la operación.
 */
const Classifications = sequelize.define('Classifications', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  /**
   * Método de entrada: texto libre, imagen (gpt-4o Vision) o documento OCR (gpt-4o Vision).
   * Determina el modelo de OpenAI y el flujo de procesamiento.
   */
  inputType: {
    type: DataTypes.ENUM('text', 'image', 'ocr'),
    allowNull: false,
    defaultValue: 'text',
  },
  /**
   * Descripción textual o URL de Cloudinary (para image/ocr).
   */
  inputData: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  /**
   * Código HS internacional de 6 dígitos (Sistema Armonizado OMA).
   */
  hsCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  /**
   * Subpartida nacional del país exportador (ISO alpha-3: originCountry).
   */
  hsCodeOrigin: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  /**
   * Subpartida nacional del país importador (ISO alpha-3: destCountry).
   */
  hsCodeDest: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  /**
   * País exportador (quien envía la mercancía) — ISO alpha-3.
   * Nombre de campo técnico; en la UI siempre se muestra como "País exportador".
   */
  originCountry: {
    type: DataTypes.STRING(3),
    allowNull: true,
  },
  /**
   * País importador (quien recibe la mercancía) — ISO alpha-3.
   * Nombre de campo técnico; en la UI siempre se muestra como "País importador".
   */
  destCountry: {
    type: DataTypes.STRING(3),
    allowNull: true,
  },
  /**
   * Resultado completo del clasificador: aranceles, documentos, regulaciones, acuerdos.
   * Generado por openai.service.js + tariff.service.js consolidados.
   */
  resultJson: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  /**
   * Scoring de confianza arancelario 0–100. Solo disponible en planes Pro, Team, Enterprise.
   */
  confidence: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 0, max: 100 },
  },
  /**
   * Resultado completo del análisis espejo exportador–importador.
   * Solo disponible en planes Pro, Team, Enterprise. Null para Free.
   */
  mirrorAnalysis: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'error'),
    allowNull: false,
    defaultValue: 'pending',
  },
}, {
  tableName: 'classifications',
  timestamps: true,
});

module.exports = Classifications;
