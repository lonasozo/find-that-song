import { exchangeCodeForToken } from '../../lib/spotify';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    // Exchange the code for an access token
    const tokenData = await exchangeCodeForToken(code);

    // Store the token data in session or return to client
    // (How you handle this depends on your authentication strategy)

    // Example: Store in session and redirect
    // req.session.tokenData = tokenData;
    // return res.redirect('/dashboard');

    // For debugging, return the token data
    return res.status(200).json({
      success: true,
      message: 'Successfully authenticated with Spotify',
      // Don't expose the actual tokens in production
      tokenInfo: {
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        hasRefreshToken: !!tokenData.refresh_token
      }
    });
  } catch (error) {
    console.error('Error in callback handler:', error);

    return res.status(500).json({
      error: 'Failed to exchange code for token',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.response?.data : undefined
    });
  }
}
