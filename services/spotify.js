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
  async getRecentlyPlayed(accessToken) {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
        headers: { 'Authorization': 'Bearer ' + accessToken }
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
   * @param {string} accessToken - Spotify access token
   * @returns {Promise<Object>} - User profile data
   */
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting user profile:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get music recommendations based on seeds
   * @param {string} accessToken - Spotify access token
   * @param {Object} options - Options for recommendations
   * @returns {Promise<Array>} - Recommended tracks
   */
  async getRecommendations(accessToken, options) {
    try {
      const { seedTracks = [], seedArtists = [], seedGenres = [], limit = 20 } = options;

      const params = new URLSearchParams();
      params.append('limit', limit);

      if (seedTracks.length > 0) {
        params.append('seed_tracks', seedTracks.join(','));
      }

      if (seedArtists.length > 0) {
        params.append('seed_artists', seedArtists.join(','));
      }

      if (seedGenres.length > 0) {
        params.append('seed_genres', seedGenres.join(','));
      }

      const response = await axios.get(`https://api.spotify.com/v1/recommendations?${params.toString()}`, {
        headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
        }
      });

      return response.data.tracks;
    } catch (error) {
      console.error('Error getting recommendations:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a new playlist
   * @param {string} accessToken - Spotify access token
   * @param {string} userId - Spotify user ID
   * @param {Object} playlistData - Playlist details
   * @returns {Promise<Object>} - Created playlist data
   */
  async createPlaylist(accessToken, userId, playlistData) {
    try {
      const { name, description, isPublic } = playlistData;

      const response = await axios.post(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          name,
          description,
          public: isPublic
        },
        {
          headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating playlist:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Add tracks to a playlist
   * @param {string} accessToken - Spotify access token
   * @param {string} playlistId - Playlist ID
   * @param {Array<string>} trackUris - Track URIs to add
   * @returns {Promise<Object>} - API response
   */
  async addTracksToPlaylist(accessToken, playlistId, trackUris) {
    try {
      const response = await axios.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        { uris: trackUris },
        {
          headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error adding tracks to playlist:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new SpotifyService();
