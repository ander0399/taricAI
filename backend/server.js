require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./src/models');
const authRoutes = require('./src/routes/authRoutes');
const invitationRoutes = require('./src/routes/invitationRoutes');
const userRoutes = require('./src/routes/userRoutes');
const classificationRoutes = require('./src/routes/classificationRoutes');
const classifierRoutes = require('./src/routes/classifier.routes');
const enterpriseRoutes = require('./src/routes/enterpriseRoutes');
const stripeRoutes        = require('./src/routes/stripe.routes');
const subscriptionRoutes  = require('./src/routes/subscription.routes');
const chatRoutes          = require('./src/routes/chat.routes');
const riskMapRoutes       = require('./src/routes/riskMap.routes');
const trackingRoutes      = require('./src/routes/tracking.routes');
const { handleWebhook } = require('./src/controllers/stripe.controller');
const errorHandler = require('./src/utils/errorHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// ⚠️ El webhook de Stripe DEBE registrarse ANTES de express.json().
// stripe.webhooks.constructEvent valida la firma HMAC sobre el body crudo (Buffer).
// Si express.json() parsea el body primero, el Buffer se destruye y la firma falla siempre.
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  handleWebhook
);

// Middleware global JSON — después del webhook para no interferir con el body raw
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classifications', classificationRoutes);
app.use('/api/classifier', classifierRoutes);
app.use('/api/enterprise', enterpriseRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/risk-map', riskMapRoutes);
app.use('/api/tracking', trackingRoutes);

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Manejo de errores (siempre al final)
app.use(errorHandler);

/**
 * @description Inicializa la conexión a la DB y levanta el servidor.
 * Usa sequelize.sync({ alter: true }) solo en desarrollo.
 */
const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✓ Conexión a PostgreSQL establecida.');

    if (process.env.NODE_ENV === 'development') {
      // sync({ alter: true }) falla en PostgreSQL cuando hay columnas ENUM existentes
      // porque genera SQL con USING inline que Postgres no acepta.
      // Solución: sync por modelo con fallback — alter para modelos sin ENUM, create-only para los que tienen.
      const models = Object.values(sequelize.models);
      for (const model of models) {
        try {
          await model.sync({ alter: true });
        } catch (e) {
          const isEnumSyntaxError =
            e.original?.code === '42601' ||
            e.parent?.code === '42601' ||
            e.message?.includes('USING');
          if (isEnumSyntaxError) {
            await model.sync(); // crea la tabla si no existe, preserva estructura actual
            console.warn(`  ⚠ ${model.name}: columnas ENUM — alter omitido. DROP TABLE para forzar recreación.`);
          } else {
            throw e;
          }
        }
      }
      console.log('✓ Modelos sincronizados con la base de datos.');
    }

    // Auto-seed: carga datos de prueba solo si no existen aún (idempotente por UUID fijo)
    const { User, CountryRiskProfiles } = require('./src/models');
    const seedExists = await User.findByPk('a1000000-0000-0000-0000-000000000001');
    if (!seedExists) {
      console.log('✓ Datos de prueba no encontrados — ejecutando seed inicial...');
      const { runSeed } = require('./usuariosPrueba/seeders/index');
      await runSeed();
    }

    // Auto-seed: siembra/actualiza perfiles de riesgo país en cada arranque.
    // El seed es idempotente: destruye filas 'pending' y las re-inserta con TRS realistas,
    // preservando filas 'completed' actualizadas por el cron.
    const { seedCountryRiskProfiles } = require('./src/seeds/seed.countryRiskProfiles');
    await seedCountryRiskProfiles();
    console.log('✓ CountryRiskProfiles sembrado con TRS realistas.');

    // Inicializar cron de Mapa de Riesgo País solo si está habilitado
    if (process.env.RISK_MAP_CRON_ENABLED === 'true') {
      const { initRiskMapCron } = require('./src/services/riskMapCron.service');
      initRiskMapCron();
    }

    // Auto-seed: envíos demo (idempotente)
    try {
      const { seedShipments } = require('./src/seeds/seed.shipments');
      await seedShipments();
    } catch (e) {
      console.warn('[seed.shipments] Error en seed de envíos:', e.message);
    }

    // AISStream: iniciar servicio (modo demo si no hay API key)
    require('./src/services/aisstream.service');

    // WebSocket proxy — reenvía posiciones AIS en tiempo real al frontend
    if (process.env.TRACKING_WS_ENABLED !== 'false') {
      const { setupTrackingWS } = require('./src/services/tracking.ws');
      setupTrackingWS(server);
    }

    server.listen(PORT, () => {
      console.log(`✓ TaricAI Backend corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('✗ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

start();
