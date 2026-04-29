require('dotenv').config();
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
const { handleWebhook } = require('./src/controllers/stripe.controller');
const errorHandler = require('./src/utils/errorHandler');

const app = express();
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
      await sequelize.sync({ alter: true });
      console.log('✓ Modelos sincronizados con la base de datos.');
    }

    if (process.env.SEED_ON_START === 'true') {
      const { runSeed } = require('./usuariosPrueba/seeders/index');
      await runSeed();
    }

    app.listen(PORT, () => {
      console.log(`✓ TaricAI Backend corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('✗ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

start();
