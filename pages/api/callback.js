import { exchangeCodeForToken } from '../../lib/spotify';
import { exchangeCodeForTokenProduction } from '../../lib/spotify-production';
import { env } from '../../lib/env';

export default async function handler(req, res) {
  const { code } = req.query;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    console.log(`API Callback Handler - Environment: ${process.env.NODE_ENV}`);
    console.log(`Redirect URI from env: ${env.SPOTIFY_REDIRECT_URI}`);

    // Check for potential issues before attempting the exchange
    const credentialsAreSame = env.SPOTIFY_CLIENT_ID === env.SPOTIFY_CLIENT_SECRET;

    if (credentialsAreSame) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Your Spotify client ID and client secret appear to be identical. Please check your environment variables.',
        hint: 'Visit /api/verify-credentials for more details'
      });
    }

    // Use production-specific function in production environment
    let tokenData;
    if (isProduction) {
      console.log('Using production-specific token exchange flow');
      tokenData = await exchangeCodeForTokenProduction(code);
    } else {
      console.log('Using development token exchange flow');
      tokenData = await exchangeCodeForToken(code);
    }

    return res.status(200).json({
      success: true,
      message: 'Successfully authenticated with Spotify',
      tokenInfo: {
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        hasRefreshToken: !!tokenData.refresh_token
      }
    });
  } catch (error) {
    console.error('Error in callback handler:', error);

    let errorDetails = {
      error: 'Failed to exchange code for token',
      message: error.message,
      environment: process.env.NODE_ENV,
      spotifyRedirectUri: env.SPOTIFY_REDIRECT_URI
    };

    if (error.response?.data) {
      errorDetails.spotifyError = error.response.data;

      // Add user-friendly message for common errors
      if (error.response.data.error === 'invalid_grant') {
        errorDetails.userMessage = 'The login session expired. Please try logging in again.';
      } else if (error.response.data.error === 'invalid_client') {
        errorDetails.userMessage = 'Authentication failed. Please contact support.';
      }
    }

    // Add specific guidance for common errors
    if (error.response?.status === 400) {
      errorDetails.possibleCauses = [
        'Client ID and Client Secret are incorrect or identical',
        'Redirect URI doesn\'t match the one registered in Spotify',
        'The authorization code has expired or already been used'
      ];
      errorDetails.checkEndpoint = '/api/verify-credentials';
    }

    return res.status(500).json(errorDetails);
  }
}
