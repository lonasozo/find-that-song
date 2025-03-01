import { env } from './env';
import axios from 'axios';

export function getSpotifyAuthUrl(scopes = []) {
  if (!env.validate()) {
    console.error('Cannot generate Spotify auth URL: Missing environment variables');
    return '/api/auth/error?reason=missing-env-vars';
  }

  const defaultScopes = [
    'user-read-recently-played',
    'user-top-read',
    'playlist-modify-public',
    'playlist-modify-private',
  ];

  const scopesArray = scopes.length > 0 ? scopes : defaultScopes;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.SPOTIFY_CLIENT_ID,
    scope: scopesArray.join(' '),
    redirect_uri: env.SPOTIFY_REDIRECT_URI,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
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

    console.log('Debug - Auth values:');
    console.log(`Client ID length: ${env.SPOTIFY_CLIENT_ID?.length || 0}`);
    console.log(`Client Secret length: ${env.SPOTIFY_CLIENT_SECRET?.length || 0}`);
    console.log(`Are values identical: ${env.SPOTIFY_CLIENT_ID === env.SPOTIFY_CLIENT_SECRET}`);

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
    throw error;
  }
}
