import { env } from './env';

export function getSpotifyAuthUrl(scopes = []) {
  if (!env.validate()) {
    console.error('Cannot generate Spotify auth URL: Missing environment variables');
    // Return a URL that will show an error page instead of failing silently
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
