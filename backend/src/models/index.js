const sequelize = require('../config/database');
const Company = require('./Company');
const User = require('./User');
const Team = require('./Team');
const UserTeams = require('./UserTeams');
const Invitation = require('./Invitation');
const Classifications = require('./Classifications');
const ClassificationSources = require('./ClassificationSources');
const Subscription = require('./Subscription');
const EnterpriseLeads = require('./EnterpriseLeads');
const ChatConversations = require('./ChatConversations');
const ChatMessages = require('./ChatMessages');
const CountryRiskProfiles = require('./CountryRiskProfiles');
const RiskUpdateLogs = require('./RiskUpdateLogs');
const UserMapInteractions = require('./UserMapInteractions');

// Company -> Users (1:N)
Company.hasMany(User, { foreignKey: 'companyId', as: 'usuarios' });
User.belongsTo(Company, { foreignKey: 'companyId', as: 'empresa' });

// Company -> Teams (1:N)
Company.hasMany(Team, { foreignKey: 'companyId', as: 'equipos' });
Team.belongsTo(Company, { foreignKey: 'companyId', as: 'empresa' });

// User <-> Team (M:N via UserTeams)
User.belongsToMany(Team, { through: UserTeams, foreignKey: 'userId', as: 'equipos' });
Team.belongsToMany(User, { through: UserTeams, foreignKey: 'teamId', as: 'miembros' });

// Company -> Invitations (1:N)
Company.hasMany(Invitation, { foreignKey: 'companyId', as: 'invitaciones' });
Invitation.belongsTo(Company, { foreignKey: 'companyId', as: 'empresa' });

// User -> Invitations enviadas (1:N)
User.hasMany(Invitation, { foreignKey: 'invitadoPorId', as: 'invitacionesEnviadas' });
Invitation.belongsTo(User, { foreignKey: 'invitadoPorId', as: 'invitadoPor' });

// User -> Classifications (1:N)
User.hasMany(Classifications, { foreignKey: 'userId', as: 'clasificaciones' });
Classifications.belongsTo(User, { foreignKey: 'userId', as: 'usuario' });

// Company -> Classifications (1:N)
Company.hasMany(Classifications, { foreignKey: 'companyId', as: 'clasificaciones' });
Classifications.belongsTo(Company, { foreignKey: 'companyId', as: 'empresa' });

// Classifications -> ClassificationSources (1:N, CASCADE delete)
Classifications.hasMany(ClassificationSources, { foreignKey: 'classificationId', as: 'fuentes' });
ClassificationSources.belongsTo(Classifications, { foreignKey: 'classificationId', as: 'clasificacion' });

// Company -> Subscription (1:1) — una empresa tiene una suscripción activa a la vez
Company.hasOne(Subscription, { foreignKey: 'companyId', as: 'suscripcion' });
Subscription.belongsTo(Company, { foreignKey: 'companyId', as: 'empresa' });

// Chat IA associations
Company.hasMany(ChatConversations, { foreignKey: 'companyId', as: 'chatConversaciones' });
ChatConversations.belongsTo(Company, { foreignKey: 'companyId', as: 'empresa' });

Company.hasMany(ChatMessages, { foreignKey: 'companyId', as: 'chatMensajes' });
ChatMessages.belongsTo(Company, { foreignKey: 'companyId', as: 'empresa' });

User.hasMany(ChatConversations, { foreignKey: 'userId', as: 'chatConversaciones' });
ChatConversations.belongsTo(User, { foreignKey: 'userId', as: 'usuario' });

User.hasMany(ChatMessages, { foreignKey: 'userId', as: 'chatMensajes' });
ChatMessages.belongsTo(User, { foreignKey: 'userId', as: 'usuario' });

ChatConversations.hasMany(ChatMessages, { foreignKey: 'conversationId', as: 'mensajes', onDelete: 'CASCADE' });
ChatMessages.belongsTo(ChatConversations, { foreignKey: 'conversationId', as: 'conversacion' });

// Risk Map — UserMapInteractions tiene FK a User y Company para aislamiento multi-tenant
User.hasMany(UserMapInteractions, { foreignKey: 'userId', as: 'mapInteracciones' });
UserMapInteractions.belongsTo(User, { foreignKey: 'userId', as: 'usuario' });

Company.hasMany(UserMapInteractions, { foreignKey: 'companyId', as: 'mapInteracciones' });
UserMapInteractions.belongsTo(Company, { foreignKey: 'companyId', as: 'empresa' });

// CountryRiskProfiles y RiskUpdateLogs no tienen FK formal — sin JOIN en logs/perfiles
module.exports = {
  sequelize,
  Company,
  User,
  Team,
  UserTeams,
  Invitation,
  Classifications,
  ClassificationSources,
  Subscription,
  EnterpriseLeads,
  ChatConversations,
  ChatMessages,
  CountryRiskProfiles,
  RiskUpdateLogs,
  UserMapInteractions,
};
