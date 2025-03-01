import { useEffect, useState } from 'react';
import { getSpotifyAuthUrl } from '../lib/spotify';

export default function SpotifyLogin() {
  const [loginUrl, setLoginUrl] = useState('');
  
  useEffect(() => {
    // Generate the auth URL dynamically based on current environment
    const url = getSpotifyAuthUrl();
    
    // Override redirect URI if needed based on environment
    if (typeof window !== 'undefined') {
      // We're in browser, let's check our environment
      const isLocalhost = window.location.hostname === 'localhost';
      const baseUrl = isLocalhost 
        ? 'http://localhost:3000/callback'
        : 'https://find-that-song.vercel.app/callback';
        
      // Use URLSearchParams to update the redirect_uri parameter if needed
      const urlObj = new URL(url);
      const params = new URLSearchParams(urlObj.search);
      
      if (params.get('redirect_uri') !== baseUrl) {
        console.log(`Updating redirect URI to match current environment: ${baseUrl}`);
        params.set('redirect_uri', baseUrl);
        urlObj.search = params.toString();
        setLoginUrl(urlObj.toString());
      } else {
        setLoginUrl(url);
      }
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
