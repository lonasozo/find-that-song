// Funzione per accedere in modo sicuro alle variabili d'ambiente
function getEnvVariable(key) {
  // In Next.js, process.env può essere usato direttamente
  // In altre applicazioni potrebbe essere necessario usare import.meta.env o altri metodi
  const value = process.env[key];

  if (!value && process.env.NODE_ENV !== 'production') {
    console.warn(`La variabile d'ambiente ${key} non è definita`);
  }

  return value;
}

// Esporta tutte le variabili d'ambiente necessarie
export const environment = {
  spotify: {
    clientId: getEnvVariable('SPOTIFY_CLIENT_ID'),
    clientSecret: getEnvVariable('SPOTIFY_CLIENT_SECRET'),
    redirectUri: getEnvVariable('SPOTIFY_REDIRECT_URI'),
  },
  analytics: {
    // Disabilita le analytics in ambiente di sviluppo se necessario
    enabled: process.env.NODE_ENV === 'production',
    // Puoi aggiungere altre configurazioni di analytics qui
  }
};
