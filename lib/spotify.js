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
    throw new Error('Missing or invalid environment variables for Spotify authentication');
  }

  try {
    const tokenUrl = 'https://accounts.spotify.com/api/token';

    // Create form data for token request
    const params = new URLSearchParams({
      code,
      redirect_uri: env.SPOTIFY_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    // Double check that client ID and secret are different
    if (env.SPOTIFY_CLIENT_ID === env.SPOTIFY_CLIENT_SECRET) {
      throw new Error('Client ID and Client Secret cannot be identical');
    }

    // Create base64 encoded auth string from client ID and secret
    const auth = Buffer.from(
      `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64');

    // Log the first few chars of each credential for debugging (don't log full values)
    console.log('Debug - Auth values:');
    console.log(`Client ID: ${env.SPOTIFY_CLIENT_ID?.substring(0, 4)}...`);
    console.log(`Client Secret: ${env.SPOTIFY_CLIENT_SECRET?.substring(0, 4)}...`);
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
    // Add more detailed error information
    const errorInfo = {
      message: error.message,
      response: error.response?.data || 'No response data',
      authBase64Prefix: env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET ?
        Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString('base64').substring(0, 10) + '...' :
        'Cannot generate'
    };

    console.error('Error exchanging code for token:', errorInfo);
    throw error;
  }
}
