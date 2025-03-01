import { useEffect, useState } from 'react';
import { getSpotifyAuthUrl } from '../lib/spotify';
import { getProductionSpotifyAuthUrl } from '../lib/spotify-production';

export default function SpotifyLogin() {
  const [loginUrl, setLoginUrl] = useState('');
  
  useEffect(() => {
    // Check if we're in production
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Use the production-specific function in production
    const url = isProduction ? getProductionSpotifyAuthUrl() : getSpotifyAuthUrl();
    
    // Override redirect URI if needed based on environment
    if (typeof window !== 'undefined') {
      // We're in browser, let's check our environment
      const isLocalhost = window.location.hostname === 'localhost';
      const baseUrl = isLocalhost 
        ? 'http://localhost:3000/callback'
        : 'https://find-that-song.vercel.app/callback';
      
      setLoginUrl(url);
    } else {
      setLoginUrl(url);
    }
  }, []);
  
  return (
    <a 
      href={loginUrl}
      className="inline-block bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition duration-300"
    >
      Login with Spotify
    </a>
  );
}
