const { Sequelize } = require('sequelize');
require('dotenv').config();

/**
 * @description Instancia de Sequelize configurada con las variables de entorno.
 * Usa pool de conexiones optimizado para entorno SaaS.
 */
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production'
        ? {
          require: true,
          rejectUnauthorized: false
        }
        : false
    },
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
