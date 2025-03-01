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

    // Ensure we use the correct redirect URI based on environment
    const redirectUri = process.env.NODE_ENV === 'production'
      ? 'https://find-that-song.vercel.app/callback'
      : env.SPOTIFY_REDIRECT_URI;

    console.log(`Using redirect URI: ${redirectUri} for environment: ${process.env.NODE_ENV}`);

    // Create form data for token request
    const params = new URLSearchParams({
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    });

    // Log the exact parameters being sent (except secret)
    console.log('Token request params:', {
      code: code.substring(0, 10) + '...',
      redirect_uri: redirectUri,
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
    // Enhanced error logging
    console.error('Error exchanging code for token:');

    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);

      // Add specific handling for common Spotify error codes
      if (error.response.status === 400) {
        const errorData = error.response.data;

        if (errorData.error === 'invalid_grant') {
          console.error('Invalid grant: The authorization code may have expired or already been used');
        } else if (errorData.error === 'invalid_client') {
          console.error('Invalid client: Client authentication failed');
        } else if (errorData.error === 'invalid_request') {
          console.error('Invalid request: Missing required parameters or redirect_uri mismatch');
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }

    throw error;
  }
}
