const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { sequelize, Company, User, Subscription } = require('../models');

const SALT_ROUNDS = 12;

/**
 * @description Registra un nuevo Owner junto con su Company en una sola transacción atómica.
 * Si cualquier paso falla, todo el proceso hace rollback — garantiza consistencia del tenant.
 * @param {{ nombreEmpresa: string, plan: string, nombre: string, email: string, password: string }} datos
 * @returns {{ user: object, company: object, token: string }}
 */
const registerOwner = async ({ nombreEmpresa, plan = 'free', nombre, email, password }) => {
  const transaction = await sequelize.transaction();

  try {
    // 1. Verificar que el email no exista en ningún tenant
    const emailExistente = await User.findOne({ where: { email }, transaction });
    if (emailExistente) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    // 2. Crear la empresa primero (propietarioId se actualiza luego)
    const company = await Company.create(
      { id: uuidv4(), nombre: nombreEmpresa, plan },
      { transaction }
    );

    // 3. Hashear la contraseña
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Crear el usuario Owner vinculado a la empresa
    const user = await User.create(
      {
        id: uuidv4(),
        nombre,
        email,
        password: passwordHash,
        role: 'owner',
        companyId: company.id,
      },
      { transaction }
    );

    // 5. Vincular el propietarioId en la empresa (actualización atómica)
    await company.update({ propietarioId: user.id }, { transaction });

    // 6. Crear registro de suscripción Free — fuente de verdad del plan activo en DB
    // Para planes de pago, este registro se sobreescribe cuando llega el webhook checkout.session.completed
    await Subscription.create(
      {
        id: uuidv4(),
        companyId: company.id,
        plan: 'free',
        stripeStatus: 'active',
        stripePriceId: null,
        quantity: 1,
      },
      { transaction }
    );

    await transaction.commit();

    // 6. Generar JWT con payload mínimo (nunca incluir password)
    const token = generateToken({ userId: user.id, companyId: company.id, role: user.role });

    return {
      token,
      user: sanitizeUser(user),
      company: sanitizeCompany(company),
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * @description Autentica un usuario existente y retorna un JWT.
 * @param {{ email: string, password: string }} credenciales
 * @returns {{ user: object, company: object, token: string }}
 */
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({
    where: { email, activo: true },
    include: [{ association: 'empresa' }],
  });

  if (!user) throw new Error('INVALID_CREDENTIALS');

  const passwordValida = await bcrypt.compare(password, user.password);
  if (!passwordValida) throw new Error('INVALID_CREDENTIALS');

  const token = generateToken({ userId: user.id, companyId: user.companyId, role: user.role });

  return {
    token,
    user: sanitizeUser(user),
    company: sanitizeCompany(user.empresa),
  };
};

/**
 * @description Genera un JWT firmado con el secreto de la aplicación.
 * @param {{ userId: string, companyId: string, role: string }} payload
 * @returns {string}
 */
const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/**
 * @description Elimina campos sensibles del objeto User antes de enviarlo al cliente.
 * @param {object} user - Instancia Sequelize de User
 * @returns {object}
 */
const sanitizeUser = (user) => {
  const { password, ...safe } = user.toJSON ? user.toJSON() : user;
  return safe;
};

/**
 * @description Retorna los campos públicos de una Company.
 * @param {object} company - Instancia Sequelize de Company
 * @returns {object}
 */
const sanitizeCompany = (company) => (company.toJSON ? company.toJSON() : company);

module.exports = { registerOwner, loginUser, generateToken };
