import { env } from '../../lib/env';

export default function handler(req, res) {
  // This endpoint should only be used during development or debugging
  // Add appropriate authentication for production use

  // Check if client ID and secret are the same
  const credentialsAreSame = env.SPOTIFY_CLIENT_ID === env.SPOTIFY_CLIENT_SECRET;

  // Check for typical issues
  const issues = [];

  if (credentialsAreSame) {
    issues.push('CLIENT_ID_EQUALS_CLIENT_SECRET');
  }

  if (!env.SPOTIFY_CLIENT_ID) {
    issues.push('MISSING_CLIENT_ID');
  }

  if (!env.SPOTIFY_CLIENT_SECRET) {
    issues.push('MISSING_CLIENT_SECRET');
  }

  if (!env.SPOTIFY_REDIRECT_URI) {
    issues.push('MISSING_REDIRECT_URI');
  } else if (!env.SPOTIFY_REDIRECT_URI.includes('callback')) {
    issues.push('REDIRECT_URI_MISSING_CALLBACK_PATH');
  }

  // Check for specific error we saw in logs
  const base64Auth = Buffer.from(
    `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  const hasSpecificError = base64Auth === 'YzI2YTQ1ZjJmZDI3NGI2NGE5N2UyYmEzMTVkOWM0YWI6YzI2YTQ1ZjJmZDI3NGI2NGE5N2UyYmEzMTVkOWM0YWI=';

  // Return diagnostic info
  res.status(200).json({
    status: issues.length === 0 ? 'OK' : 'ISSUES_FOUND',
    issues,
    clientIdFirstFour: env.SPOTIFY_CLIENT_ID ? env.SPOTIFY_CLIENT_ID.substring(0, 4) : 'none',
    clientSecretFirstFour: env.SPOTIFY_CLIENT_SECRET ? env.SPOTIFY_CLIENT_SECRET.substring(0, 4) : 'none',
    redirectUri: env.SPOTIFY_REDIRECT_URI,
    hasIdenticalCredentials: credentialsAreSame,
    matchesErrorSignature: hasSpecificError,
    recommendations: issues.length > 0 ? [
      "Make sure CLIENT_ID and CLIENT_SECRET are different values",
      "Check your Vercel environment variables",
      "Verify values match your Spotify Developer Dashboard"
    ] : []
  });
}
