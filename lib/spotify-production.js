/**
 * Production-specific Spotify authentication
 * This file contains hardcoded values for production only as a last resort
 */
import axios from 'axios';

// Hardcoded values specifically for production
const PROD_CLIENT_ID = 'c26a45f2fd274b64a97e2ba315d9c4ab';
const PROD_CLIENT_SECRET = '55db879bad24418c85a0c25cdb7b8d68';
const PROD_REDIRECT_URI = 'https://find-that-song.vercel.app/callback';

export function getProductionSpotifyAuthUrl(scopes = []) {
  const defaultScopes = [
    'user-read-recently-played',
    'user-top-read',
    'playlist-modify-public',
    'playlist-modify-private',
  ];

  const scopesArray = scopes.length > 0 ? scopes : defaultScopes;

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: PROD_CLIENT_ID,
    scope: scopesArray.join(' '),
    redirect_uri: PROD_REDIRECT_URI,
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokenProduction(code) {
  try {
    const tokenUrl = 'https://accounts.spotify.com/api/token';

    console.log('Using production-specific Spotify credentials');

    // Create form data for token request with hardcoded values
    const params = new URLSearchParams({
      code,
      redirect_uri: PROD_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    // Use hardcoded credentials for auth
    const auth = Buffer.from(
      `${PROD_CLIENT_ID}:${PROD_CLIENT_SECRET}`
    ).toString('base64');

    console.log('Production auth request parameters:');
    console.log(`- Redirect URI: ${PROD_REDIRECT_URI}`);
    console.log(`- Code length: ${code.length} characters`);
    console.log(`- Client ID: ${PROD_CLIENT_ID.substring(0, 4)}...`);

    // Make the request
    const response = await axios.post(tokenUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('Production token exchange error:',
      error.response?.status,
      error.response?.data || error.message);
    throw error;
  }
}
