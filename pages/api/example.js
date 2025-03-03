import env from '../../config/env';

export default function handler(req, res) {
  // Usa le variabili d'ambiente in modo sicuro
  const apiClient = new SomeApiClient(env.API_KEY);

  // Esempio con Spotify
  const spotifyClient = new SpotifyWebApi({
    clientId: env.SPOTIFY.CLIENT_ID,
    clientSecret: env.SPOTIFY.CLIENT_SECRET
  });

  // Resto dell'implementazione
  // res.status(200).json({ message: 'API funzionante correttamente' });
}
