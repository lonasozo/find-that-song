/**
 * Environment variable utility for Spotify authentication
 */
export const env = {
  // Explicitly separate the sources of environment variables for debugging
  _sources: {
    clientId: {
      value: process.env.SPOTIFY_CLIENT_ID || process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || null,
      source: process.env.SPOTIFY_CLIENT_ID ? 'SPOTIFY_CLIENT_ID' :
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ? 'NEXT_PUBLIC_SPOTIFY_CLIENT_ID' : 'none'
    },
    clientSecret: {
      value: process.env.SPOTIFY_CLIENT_SECRET || null,
      source: process.env.SPOTIFY_CLIENT_SECRET ? 'SPOTIFY_CLIENT_SECRET' : 'none'
    },
    redirectUri: {
      value: process.env.SPOTIFY_REDIRECT_URI || process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || null,
      source: process.env.SPOTIFY_REDIRECT_URI ? 'SPOTIFY_REDIRECT_URI' :
        process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ? 'NEXT_PUBLIC_SPOTIFY_REDIRECT_URI' : 'none'
    }
  },

  // Use getters to always pull the latest values
  get SPOTIFY_CLIENT_ID() {
    return this._sources.clientId.value;
  },

  get SPOTIFY_CLIENT_SECRET() {
    return this._sources.clientSecret.value;
  },

  get SPOTIFY_REDIRECT_URI() {
    return this._sources.redirectUri.value;
  },

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

    // Check for improper configurations
    if (this.SPOTIFY_CLIENT_ID === this.SPOTIFY_CLIENT_SECRET) {
      console.error('Warning: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are identical. This is incorrect.');
      return false;
    }

    // Check for double slashes in redirect URI
    if (this.SPOTIFY_REDIRECT_URI && this.SPOTIFY_REDIRECT_URI.includes('//callback')) {
      console.error('Warning: SPOTIFY_REDIRECT_URI contains a double slash before "callback". This is likely incorrect.');
      return false;
    }

    return true;
  },

  // Debug helper to see what environment variables are loaded
  debug() {
    return {
      SPOTIFY_CLIENT_ID: this.SPOTIFY_CLIENT_ID ?
        `✓ Set (${this.SPOTIFY_CLIENT_ID.substring(0, 4)}...) from ${this._sources.clientId.source}` : '❌ Missing',
      SPOTIFY_CLIENT_SECRET: this.SPOTIFY_CLIENT_SECRET ?
        `✓ Set (${this.SPOTIFY_CLIENT_SECRET.substring(0, 4)}...) from ${this._sources.clientSecret.source}` : '❌ Missing',
      SPOTIFY_REDIRECT_URI: this.SPOTIFY_REDIRECT_URI ?
        `${this.SPOTIFY_REDIRECT_URI} from ${this._sources.redirectUri.source}` : '❌ Missing',
      CLIENT_ID_SECRET_IDENTICAL: this.SPOTIFY_CLIENT_ID === this.SPOTIFY_CLIENT_SECRET ?
        '⚠️ Warning: Values are identical' : '✓ Values are different',
    };
  }
};
