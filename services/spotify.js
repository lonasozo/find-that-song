const axios = require('axios');
const querystring = require('querystring');

class SpotifyService {
  constructor() {
    this.client_id = process.env.SPOTIFY_CLIENT_ID;
    this.client_secret = process.env.SPOTIFY_CLIENT_SECRET;
    this.redirect_uri = process.env.SPOTIFY_REDIRECT_URI;
  }

  /**
   * Get authorization URL for Spotify login
   * @param {string} scope - Spotify permission scopes
   * @returns {string} - Authorization URL
   */
  getAuthorizationUrl(scope) {
    return 'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: this.client_id,
        scope: scope,
        redirect_uri: this.redirect_uri
      });
  }

  /**
   * Exchange authorization code for access token
   * @param {string} code - Authorization code from Spotify
   * @returns {Promise<Object>} - Token response with access_token
   */
  async getAccessToken(code) {
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token',
        querystring.stringify({
          code: code,
          redirect_uri: this.redirect_uri,
          grant_type: 'authorization_code'
        }),
        {
          headers: {
            'Authorization': 'Basic ' + (Buffer.from(this.client_id + ':' + this.client_secret).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });

      return response.data;
    } catch (error) {
      console.error('Error getting access token:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user's recently played tracks
   * @param {string} accessToken - Spotify access token
   * @returns {Promise<Array>} - Recently played tracks
   */
  async getRecentlyPlayed(accessToken, limit = 50) {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
        headers: { 'Authorization': 'Bearer ' + accessToken },
        params: { limit: limit }

      });

      return response.data.items;
    } catch (error) {
      console.error('Error getting recently played tracks:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user's top tracks
   * @param {string} accessToken - Spotify access token
   * @param {string} timeRange - Time range (short_term, medium_term, long_term)
   * @param {number} limit - Number of tracks to return
   * @returns {Promise<Array>} - Top tracks
   */
  async getTopTracks(accessToken, timeRange = 'medium_term', limit = 50) {
    try {
      const response = await axios.get(`https://api.spotify.com/v1/me/top/tracks`, {
        params: { time_range: timeRange, limit },
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });

      return response.data.items;
    } catch (error) {
      console.error('Error getting top tracks:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user's top artists
   * @param {string} accessToken - Spotify access token
   * @param {string} timeRange - Time range (short_term, medium_term, long_term)
   * @param {number} limit - Number of artists to return
   * @returns {Promise<Array>} - Top artists
   */
  async getTopArtists(accessToken, timeRange = 'medium_term', limit = 50) {
    try {
      const response = await axios.get(`https://api.spotify.com/v1/me/top/artists`, {
        params: { time_range: timeRange, limit },
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });

      return response.data.items;
    } catch (error) {
      console.error('Error getting top artists:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get user profile information
   * @returns {Promise<Object>} - User profile data
   */
  async getUserProfile() {
    try {
      // Ensure we have the access token
      await this.ensureAccessToken();

      console.log('Getting user profile');

      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });

      console.log(`Got profile for user: ${response.data.display_name} (${response.data.id})`);
      return response.data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Get available genre seeds from Spotify
   * @returns {Promise<string[]>} Array of available genre seeds
   */
  async getAvailableGenreSeeds() {
    try {
      await this.ensureAccessToken();

      console.log('Fetching available genre seeds from Spotify...');

      // Hardcoded list of common Spotify genres as fallback
      const commonGenres = [
        'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'blues',
        'classical', 'country', 'dance', 'electronic', 'folk', 'funk',
        'hip-hop', 'house', 'indie', 'jazz', 'metal', 'pop', 'punk', 'r-n-b',
        'reggae', 'rock', 'soul'
      ];

      try {
        const response = await axios({
          method: 'get',
          url: 'https://api.spotify.com/v1/recommendations/available-genre-seeds',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });

        if (response.data && response.data.genres && response.data.genres.length > 0) {
          console.log(`Retrieved ${response.data.genres.length} available genre seeds from API`);
          return response.data.genres;
        } else {
          console.log('API returned empty genre list, using common genres');
          return commonGenres;
        }
      } catch (error) {
        console.error('Error fetching genre seeds from API, using common genres:', error.message);
        return commonGenres;
      }
    } catch (error) {
      console.error('Error in getAvailableGenreSeeds:', error.message);

      // Return a safe default list of common genres
      return ['pop', 'rock', 'hip-hop', 'electronic', 'indie', 'jazz', 'alternative'];
    }
  }

  /**
   * Get music recommendations based on seeds
   * @param {string} type - Type of recommendation (top_artists, genres)
   * @param {Object} options - Options for recommendations
   * @returns {Promise<Object>} - Recommended tracks
   */
  async getRecommendations(type, options = {}) {
    try {
      await this.ensureAccessToken();

      const { limit = 20 } = options;
      let seedArtists = [];
      let seedTracks = [];
      let seedGenres = [];

      console.log(`Getting recommendations with type: ${type}, limit: ${limit}`);

      // Handle different recommendation types
      if (type === 'top_artists') {
        // Get user's top artists first
        try {
          console.log('Fetching user top artists...');
          const topItems = await this.getTopItems('artists', { limit: 5, time_range: 'medium_term' });

          if (topItems && topItems.items && topItems.items.length > 0) {
            // Extract artist IDs for seed
            seedArtists = topItems.items.slice(0, 5).map(artist => artist.id);
            console.log(`Using seed artists: ${seedArtists.join(', ')}`);
          } else {
            console.log('No top artists found, will try genres...');
            // Use some default genres if no artists found
            seedGenres = ['pop', 'rock'];
          }
        } catch (error) {
          console.error('Error getting top artists:', error.message);
          // Use some default genres if error occurs
          seedGenres = ['pop', 'rock'];
        }
      } else if (type === 'genres') {
        // Get genre seeds from options
        if (options.genres && Array.isArray(options.genres) && options.genres.length > 0) {
          seedGenres = options.genres.slice(0, 5); // Limit to 5 genres max
          console.log(`Using seed genres: ${seedGenres.join(', ')}`);
        } else {
          console.log('No genres provided, using default genres');
          seedGenres = ['pop', 'rock'];
        }
      }

      // Simplified request with minimal parameters to maximize chance of success
      let requestParams = { limit };

      // Add either artists or genres, not both, to reduce chance of errors
      if (seedArtists.length > 0) {
        requestParams.seed_artists = seedArtists.join(',');
      } else if (seedGenres.length > 0) {
        requestParams.seed_genres = seedGenres.join(',');
      } else {
        // Last resort - use pop and rock
        requestParams.seed_genres = 'pop,rock';
      }

      console.log('Making recommendation request with params:', JSON.stringify(requestParams));

      // Try the API call with retries
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          const response = await axios({
            method: 'get',
            url: 'https://api.spotify.com/v1/recommendations',
            headers: {
              'Authorization': `Bearer ${this.accessToken}`
            },
            params: requestParams
          });

          if (response.data && response.data.tracks && response.data.tracks.length > 0) {
            console.log(`Successfully received ${response.data.tracks.length} recommendations`);
            return response.data;
          } else {
            console.log('Got empty track list, trying again with different parameters');

            // Try with different genres for next attempt
            if (attempts === 0) {
              requestParams = {
                limit,
                seed_genres: 'pop,electronic'
              };
            } else if (attempts === 1) {
              requestParams = {
                limit,
                seed_genres: 'rock,alternative'
              };
            }

            attempts++;
          }
        } catch (error) {
          console.error(`Attempt ${attempts + 1} failed:`, error.message);

          // Try with different genres for next attempt
          if (attempts === 0) {
            requestParams = {
              limit,
              seed_genres: 'pop,electronic'
            };
          } else if (attempts === 1) {
            requestParams = {
              limit,
              seed_genres: 'rock,alternative'
            };
          }

          attempts++;
        }
      }

      // If all attempts failed, try our simplified last resort method
      return this.getLastResortTracks(limit);
    } catch (error) {
      console.error('Error in getRecommendations:', error.message);
      return this.getLastResortTracks(options.limit || 20);
    }
  }

  /**
   * Last resort method to get tracks when all else fails
   * @param {number} limit - Number of tracks to return
   * @returns {Promise<Object>} - Recommendations object with tracks
   */
  async getLastResortTracks(limit = 20) {
    try {
      console.log('Trying last resort method to get tracks...');

      // Try to get the user's top tracks directly
      try {
        const topTracks = await this.getTopItems('tracks', { limit });

        if (topTracks && topTracks.items && topTracks.items.length > 0) {
          console.log('Using user\'s top tracks as recommendations');
          return {
            tracks: topTracks.items,
            seeds: [{ id: 'top_tracks', type: 'fallback' }]
          };
        }
      } catch (topTracksError) {
        console.error('Error getting top tracks:', topTracksError.message);
      }

      // Final resort - create a basic structure with empty tracks
      console.log('All recommendation methods failed, returning empty track list');
      return { tracks: [] };
    } catch (error) {
      console.error('Error in last resort method:', error.message);
      return { tracks: [] };
    }
  }

  /**
   * Get user's top items (artists or tracks)
   * @param {string} type - Type of items to get ('artists' or 'tracks')
   * @param {Object} options - Options for the request
   * @returns {Promise<Object>} - Promise resolving to top items response
   */
  async getTopItems(type, options = {}) {
    const { limit = 20, time_range = 'medium_term' } = options;

    try {
      await this.ensureAccessToken();

      const params = new URLSearchParams();
      params.append('limit', limit);
      params.append('time_range', time_range);

      const response = await axios.get(
        `https://api.spotify.com/v1/me/top/${type}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          },
          params: params
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error getting top ${type}:`, error);

      // If 403 error (user hasn't used Spotify enough)
      if (error.response && (error.response.status === 403 || error.response.status === 404)) {
        console.log(`User doesn't have enough ${type} history, returning empty array`);
        return { items: [] };
      }

      throw error;
    }
  }

  /**
   * Ensure we have a valid access token
   */
  async ensureAccessToken() {
    if (!this.accessToken) {
      // We need the access token from the request
      // This should be stored in a session or provided with each request
      throw new Error('Access token required for this operation');
    }

    // If we have an expiration time and it's past, refresh the token
    if (this.tokenExpiration && Date.now() > this.tokenExpiration) {
      await this.refreshToken();
    }

    return this.accessToken;
  }

  /**
   * Set the access token for API calls
   * @param {string} token - The access token
   * @param {number} expiresIn - Time in seconds until the token expires
   */
  setAccessToken(token, expiresIn = 3600) {
    this.accessToken = token;
    this.tokenExpiration = Date.now() + (expiresIn * 1000);
    console.log('Access token set, expires in', expiresIn, 'seconds');
  }

  /**
   * Create a new playlist
   * @param {string} name - The name of the playlist
   * @returns {Promise<Object>} - Created playlist data
   */
  async createPlaylist(name) {
    try {
      // Ensure we have the access token
      await this.ensureAccessToken();

      // Get the current user's profile to get their ID
      const userProfile = await this.getUserProfile(this.accessToken);
      const userId = userProfile.id;

      console.log(`Creating playlist "${name}" for user ${userId}`);

      const response = await axios.post(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          name: name || `Find That Song - ${new Date().toLocaleDateString()}`,
          description: 'Created with Find That Song app',
          public: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Playlist created with ID: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error('Error creating playlist:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Add tracks to a playlist
   * @param {string} playlistId - Playlist ID
   * @param {Array<string>} trackUris - Track URIs to add
   * @returns {Promise<Object>} - API response
   */
  async addTracksToPlaylist(playlistId, trackUris) {
    try {
      // Ensure we have the access token
      await this.ensureAccessToken();

      console.log(`Adding ${trackUris.length} tracks to playlist ${playlistId}`);

      const response = await axios.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        { uris: trackUris },
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Tracks added successfully');
      return response.data;
    } catch (error) {
      console.error('Error adding tracks to playlist:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }
}

module.exports = new SpotifyService();
