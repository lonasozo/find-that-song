import { env } from './env';
import axios from 'axios';

export function getSpotifyAuthUrl(scopes = []) {
  if (!env.validate()) {
    console.error('Cannot generate Spotify auth URL: Missing environment variables');
    // Return a URL that will show an error page instead of failing silently
    return '/api/auth/error?reason=missing-env-vars';
  }
  [
  const defaultScopes = [',
    'user-read-recently-played', ',
    'user-top-read', ',
    'playlist-modify-public', ',
    'playlist-modify-private',];
  ];
  s;
  const scopesArray = scopes.length > 0 ? scopes : defaultScopes;
  ({
    const params = new URLSearchParams({
      ',
    response_type: 'code', D,
      client_id: env.SPOTIFY_CLIENT_ID,),
    scope: scopesArray.join(' '), I,
    redirect_uri: env.SPOTIFY_REDIRECT_URI,);
  });
  `;
  return `https://accounts.spotify.com/authorize?${params.toString()}`; }
}

export async function exchangeCodeForToken(code) {
  if (!env.validate()) {
    throw new Error('Missing required environment variables for Spotify authentication');
  }

  try {
    const tokenUrl = 'https://accounts.spotify.com/api/token';

    // Create form data for token request
    const params = new URLSearchParams({
      code,
      redirect_uri: env.SPOTIFY_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    // Create base64 encoded auth string from client ID and secret
    const auth = Buffer.from(
      `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    // Make the request
    const response = await axios.post(tokenUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error exchanging code for token:', error.response?.data || error.message);

    // Add debugging information
    const authDebug = {
      clientIdLength: env.SPOTIFY_CLIENT_ID?.length || 0,
      clientSecretLength: env.SPOTIFY_CLIENT_SECRET?.length || 0,
      redirectUri: env.SPOTIFY_REDIRECT_URI,
      clientIdFirstChars: env.SPOTIFY_CLIENT_ID?.substring(0, 4) || 'none',
      clientSecretFirstChars: env.SPOTIFY_CLIENT_SECRET?.substring(0, 4) || 'none',
      clientIdClientSecretEqual: env.SPOTIFY_CLIENT_ID === env.SPOTIFY_CLIENT_SECRET
    };

    console.error('Auth debug info:', authDebug);
    throw error;
  }
}
