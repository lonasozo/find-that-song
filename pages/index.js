import { getSpotifyAuthUrl } from '../lib/spotify';
import { getProductionSpotifyAuthUrl } from '../lib/spotify-production';
import { useEffect } from 'react';

export default function HomePage() {
  // Determine which auth URL to use based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  const authUrl = isProduction ? getProductionSpotifyAuthUrl() : getSpotifyAuthUrl();

  useEffect(() => {
    // Le variabili NEXT_PUBLIC sono disponibili nel browser
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

    // Esempio di uso
    fetch(`${apiBaseUrl}/songs`)
      .then(response => response.json())
      .then(data => console.log(data));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4 sm:px-6">
      <div className="text-center space-y-6 sm:space-y-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 sm:mb-8">Find That Song</h1>

        <div className="space-y-4">
          <a
            href={authUrl}
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-2 sm:py-3 px-6 sm:px-8 rounded-full text-lg sm:text-xl transition duration-300"
          >
            Enter with Spotify
          </a>

          <p className="text-base sm:text-lg max-w-md mx-auto mt-6 sm:mt-8 px-2">
            Missed the moment and didn't save your favorite song? Check your recent listens and more.
          </p>
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <div className="text-xs opacity-50 mt-6 sm:mt-8">
            Dev mode: Using development auth flow
          </div>
        )}

        <p>Environment: {process.env.NEXT_PUBLIC_APP_ENV}</p>
      </div>
    </div>
  );
}
