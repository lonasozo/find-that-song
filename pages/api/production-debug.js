export default function handler(req, res) {
  const envData = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
    hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
    hasRedirectUri: !!process.env.SPOTIFY_REDIRECT_URI,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    // Only show first few chars of sensitive data
    clientIdPrefix: process.env.SPOTIFY_CLIENT_ID ?
      process.env.SPOTIFY_CLIENT_ID.substring(0, 4) + '...' : null
  };

  res.status(200).json(envData);
}
