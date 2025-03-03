/**
 * Central configuration file for environment variables
 * Provides validation and default values for environment variables
 */

// Funzione helper per gestire le variabili obbligatorie
const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

// Funzione helper per le variabili opzionali con valore di default
const optionalEnv = (name, defaultValue) => {
  return process.env[name] || defaultValue;
};

// Esporta le variabili d'ambiente con validazione
module.exports = {
  // API Keys
  API_KEY: requireEnv('API_KEY'),
  SPOTIFY: {
    CLIENT_ID: requireEnv('SPOTIFY_CLIENT_ID'),
    CLIENT_SECRET: requireEnv('SPOTIFY_CLIENT_SECRET'),
    REDIRECT_URL: requireEnv('SPOTIFY_REDIRECT_URL'),
  },

  // Database
  // DATABASE_URL: requireEnv('DATABASE_URL'),

  // Auth
  // JWT_SECRET: requireEnv('JWT_SECRET'),

  // App config
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  PORT: optionalEnv('PORT', '3000'),

  // Public variables (safe to expose to browser)
  public: {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
    APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  }
};
