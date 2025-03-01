import { env } from '../../lib/env';

export default function handler(req, res) {
  // Only allow in development environment or with specific auth header
  if (process.env.NODE_ENV !== 'development' &&
    req.headers.authorization !== `Bearer ${process.env.DEBUG_SECRET_KEY}`) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  res.status(200).json({
    environment: process.env.NODE_ENV,
    envStatus: env.debug(),
    systemEnv: {
      // Shows if these keys exist, not the actual values
      NEXT_PUBLIC_SPOTIFY_CLIENT_ID: !!process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
      SPOTIFY_CLIENT_ID: !!process.env.SPOTIFY_CLIENT_ID,
      SPOTIFY_REDIRECT_URI: !!process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || !!process.env.SPOTIFY_REDIRECT_URI,
    }
  });
}
