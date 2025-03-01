/**
 * Environment variable utility for Spotify authentication
 */
export const env = {
  SPOTIFY_CLIENT_ID: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || process.env.SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URI: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || process.env.SPOTIFY_REDIRECT_URI,

  // Validate that required environment variables are set
  validate() {
    const missing = [];
    if (!this.SPOTIFY_CLIENT_ID) missing.push('SPOTIFY_CLIENT_ID');
    if (!this.SPOTIFY_CLIENT_SECRET) missing.push('SPOTIFY_CLIENT_SECRET');
    if (!this.SPOTIFY_REDIRECT_URI) missing.push('SPOTIFY_REDIRECT_URI');

    if (missing.length > 0) {
      console.error(`Missing required environment variables: ${missing.join(', ')}`);
      return false;
    }
    return true;
  },

  // Debug helper to see what environment variables are loaded
  debug() {
    return {
      SPOTIFY_CLIENT_ID: this.SPOTIFY_CLIENT_ID ? '✓ Set' : '❌ Missing',
      SPOTIFY_CLIENT_SECRET: this.SPOTIFY_CLIENT_SECRET ? '✓ Set' : '❌ Missing',
      SPOTIFY_REDIRECT_URI: this.SPOTIFY_REDIRECT_URI ? '✓ Set' : '❌ Missing',
    };
  }
};
