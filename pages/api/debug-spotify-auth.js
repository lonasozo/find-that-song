import { env } from '../../lib/env';

export default function handler(req, res) {
  // Security check - restrict to development or admin token
  if (process.env.NODE_ENV !== 'development' &&
    req.headers.authorization !== `Bearer ${process.env.DEBUG_SECRET_KEY}`) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  // Check the actual environment variables directly
  const envVariables = {
    // Direct from process.env
    direct: {
      SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || null,
      SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || null,
      NEXT_PUBLIC_SPOTIFY_CLIENT_ID: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || null,
      NEXT_PUBLIC_SPOTIFY_REDIRECT_URI: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || null,
    },
    // From our env utility
    fromEnvUtil: {
      SPOTIFY_CLIENT_ID: env.SPOTIFY_CLIENT_ID || null,
      SPOTIFY_CLIENT_SECRET: env.SPOTIFY_CLIENT_SECRET || null,
      SPOTIFY_REDIRECT_URI: env.SPOTIFY_REDIRECT_URI || null,
    }
  };

  // Generate what would be the Authorization header
  const authString = `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`;
  const base64Auth = Buffer.from(authString).toString('base64');
  const problemSignature = 'YzI2YTQ1ZjJmZDI3NGI2NGE5N2UyYmEzMTVkOWM0YWI6YzI2YTQ1ZjJmZDI3NGI2NGE5N2UyYmEzMTVkOWM0YWI=';

  res.status(200).json({
    authHeader: {
      base64: base64Auth,
      matchesProblemSignature: base64Auth === problemSignature
    },
    environment: process.env.NODE_ENV,
    valuesIdentical: env.SPOTIFY_CLIENT_ID === env.SPOTIFY_CLIENT_SECRET,
    envSources: envVariables,
    recommendations: [
      "Check if NEXT_PUBLIC_SPOTIFY_CLIENT_ID is set to the same value as SPOTIFY_CLIENT_SECRET",
      "Verify Vercel environment variable configuration",
      "Check if you accidentally copied the client ID into both fields"
    ]
  });
}
