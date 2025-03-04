/**
 * Server entry point for local development
 * This file is not used in production (Vercel)
 */

// Carica le variabili d'ambiente prima di importare il modulo app
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Forza l'ambiente di sviluppo quando avviato con server.js
process.env.NODE_ENV = 'development';

const app = require('./index');
const port = process.env.PORT || 3000;

// Create HTTP server
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Local: http://localhost:${port}`);
});

// Handle graceful shutdown
const gracefulShutdown = () => {
  console.log('\nReceived shutdown signal, closing server...');

  server.close(() => {
    console.log('Server closed successfully');
    process.exit(0);
  });

  // Force close if it takes too long
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 5000);
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Log only, don't exit the process
});
