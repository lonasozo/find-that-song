import { getSpotifyAuthUrl } from '../lib/spotify';
import { getProductionSpotifyAuthUrl } from '../lib/spotify-production';

export default function HomePage() {
  // Determine which auth URL to use based on environment
  const isProduction = process.env.NODE_ENV === 'production';
  const authUrl = isProduction ? getProductionSpotifyAuthUrl() : getSpotifyAuthUrl();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <div className="text-center space-y-8">
        <h1 className="text-5xl font-bold mb-8">Find That Song</h1>

        <div className="space-y-4">
          <a
            href={authUrl}
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-8 rounded-full text-xl transition duration-300"
          >
            LOGIN with Spotify
          </a>

          <p className="text-lg max-w-md mx-auto mt-8">
            Missed the moment and didn't save your favorite song? Check your recent listens and more.
          </p>
        </div>

        {process.env.NODE_ENV !== 'production' && (
          <div className="text-xs opacity-50 mt-8">
            Dev mode: Using development auth flow
          </div>
        )}
      </div>
    </div>
  );
}
