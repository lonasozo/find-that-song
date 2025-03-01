import { env } from '../../../lib/env';

export default function handler(req, res) {
  const { reason } = req.query;

  res.status(500).json({
    error: reason || 'Unknown error',
    envDebug: env.debug(),
    message: 'Environment variables may not be properly configured in Vercel.'
  });
}
