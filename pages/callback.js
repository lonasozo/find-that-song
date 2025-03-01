import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function CallbackPage() {
  const router = useRouter();
  const { code, error } = router.query;
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    if (!code && !error) return;

    if (error) {
      setStatus(`Authentication error: ${error}`);
      return;
    }

    async function handleCallback() {
      try {
        setStatus('Exchanging code for token...');

        const response = await fetch(`/api/callback?code=${code}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to authenticate');
        }

        setStatus('Authentication successful! Redirecting...');

        // Redirect to your app's main page
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);

      } catch (error) {
        console.error('Callback processing error:', error);
        setStatus(`Authentication failed: ${error.message}`);
      }
    }

    handleCallback();
  }, [code, error, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Spotify Authentication</h1>
        <p>{status}</p>
      </div>
    </div>
  );
}
