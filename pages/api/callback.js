import { exchangeCodeForToken } from '../../lib/spotify';
import { env } from '../../lib/env';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    // Check for potential issues before attempting the exchange
    const credentialsAreSame = env.SPOTIFY_CLIENT_ID === env.SPOTIFY_CLIENT_SECRET;

    if (credentialsAreSame) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Your Spotify client ID and client secret appear to be identical. Please check your environment variables.',
        hint: 'Visit /api/verify-credentials for more details'
      });
    }

    // Exchange the code for an access token
    const tokenData = await exchangeCodeForToken(code);

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

    // Provide more helpful error information
    let errorDetails = {
      error: 'Failed to exchange code for token',
      message: error.message
    };

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
