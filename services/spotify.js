const axios = require('axios');
const querystring = require('querystring');

class SpotifyService {
  constructor() {
    this.client_id = process.env.SPOTIFY_CLIENT_ID;
    this.client_secret = process.env.SPOTIFY_CLIENT_SECRET;

    // Add validation and fallback for redirect URI
    this.redirect_uri = process.env.SPOTIFY_REDIRECT_URI || 'https://find-that-song.vercel.app/callback';

    // Log the configuration for debugging
    console.log('SpotifyService initialized with redirect URI:', this.redirect_uri);

    // Check if redirect URI is empty and log a warning
    if (!this.redirect_uri || this.redirect_uri.trim() === '') {
      console.warn('WARNING: SPOTIFY_REDIRECT_URI is empty! Using fallback.');
      this.redirect_uri = 'https://find-that-song.vercel.app/callback';
    }
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
   * @param {number} limit - Number of tracks to return
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
   * @param {string} accessToken - Spotify access token
   * @returns {Promise<Object>} - User profile data
   */
  async getUserProfile(accessToken) {
    try {
      console.log('Getting user profile');

      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
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
   * Shuffle an array (Fisher-Yates algorithm)
   * @param {Array} array - Array to shuffle
   * @returns {Array} - Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get music recommendations based on seeds
   * @param {string} accessToken - Spotify access token
   * @param {Object} options - Options for recommendations
   * @returns {Promise<Array>} - Recommended tracks
   */
  async getRecommendations(accessToken, options = {}) {
    try {
      const {
        seedTracks = [],
        seedArtists = [],
        seedGenres = [],
        limit = 20
      } = options;

      console.log(`Getting recommendations with limit: ${limit}`);

      // If multiple genres are selected, try two approaches:
      // 1. First try with all genres as seeds (up to 5)
      // 2. If that fails, get recommendations for each genre separately and combine

      // Handle multiple genres
      if (seedGenres && seedGenres.length > 1) {
        console.log(`Multiple genres selected: ${seedGenres.join(', ')}`);

        // Try approach 1: All genres together (limited to 5)
        try {
          const combinedTracks = await this.getRecommendationsWithAllGenres(
            accessToken,
            seedGenres.slice(0, 5),
            limit
          );

          if (combinedTracks && combinedTracks.length > 0) {
            console.log(`Successfully got ${combinedTracks.length} tracks using combined genres`);
            return combinedTracks;
          }
        } catch (combinedError) {
          console.log('Combined genre approach failed, trying individual genres');
        }

        // Try approach 2: Genre by genre
        try {
          const mixedTracks = await this.getRecommendationsByGenreMix(
            accessToken,
            seedGenres,
            limit
          );

          if (mixedTracks && mixedTracks.length > 0) {
            console.log(`Successfully got ${mixedTracks.length} tracks using genre mix approach`);
            return mixedTracks;
          }
        } catch (mixError) {
          console.log('Genre mix approach failed, falling back to search');
        }

        // If both recommendation approaches fail, use search API
        console.log('Trying direct search for multiple genres...');
        return await this.searchTracksByGenre(accessToken, seedGenres, limit);
      }

      // Single genre or no genre case - use the original implementation
      // First try - use the proper seed format and standard URL format
      try {
        const params = new URLSearchParams();
        params.append('limit', limit);

        // Add seed parameters correctly
        if (seedTracks.length > 0) {
          params.append('seed_tracks', seedTracks.slice(0, 5).join(','));
          console.log(`Using seed tracks: ${params.get('seed_tracks')}`);
        }

        if (seedArtists.length > 0) {
          params.append('seed_artists', seedArtists.slice(0, 5).join(','));
          console.log(`Using seed artists: ${params.get('seed_artists')}`);
        }

        // Process genres and ensure they're valid format
        if (seedGenres.length > 0) {
          // Clean up genre names - remove spaces, lowercase, ensure they're valid
          const validGenres = seedGenres
            .filter(Boolean) // Filter out undefined/null/empty values
            .slice(0, 5)
            .map(genre => genre.toLowerCase().trim().replace(/\s+/g, '-'));

          if (validGenres.length > 0) {
            // Use common genres only if available
            const safeGenres = this.getSafeGenres(validGenres);
            params.append('seed_genres', safeGenres.join(','));
            console.log(`Using seed genres: ${params.get('seed_genres')}`);
          }
        }

        // Add audio feature parameters for variety
        if (seedGenres.includes('country')) {
          params.append('target_acousticness', '0.7');
        } else if (seedGenres.includes('pop')) {
          params.append('target_popularity', '70');
        } else if (seedGenres.includes('rock')) {
          params.append('target_energy', '0.8');
        }

        console.log('Making recommendations request with params:', params.toString());

        const response = await axios.get(
          'https://api.spotify.com/v1/recommendations', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params: params
        }
        );

        console.log(`Received ${response.data.tracks?.length || 0} recommendations`);

        // Debug logs to see what kind of tracks we're getting
        if (response.data.tracks && response.data.tracks.length > 0) {
          const firstThreeTracks = response.data.tracks.slice(0, 3);
          console.log('Sample tracks received:',
            firstThreeTracks.map(t => `"${t.name}" by ${t.artists[0].name}`).join(', '));
          return response.data.tracks;
        } else {
          throw new Error('No tracks returned from recommendations API');
        }
      } catch (recommendationsError) {
        console.error('Error in recommendations API:', recommendationsError.message);
        // Continue to backup method
      }

      // Second approach - try search as a fallback instead of recommendations
      console.log('Trying direct search for tracks by genre...');
      return await this.searchTracksByGenre(accessToken, seedGenres[0] || 'country', limit);
    } catch (error) {
      console.error('All recommendation methods failed:', error);
      // Try fallback tracks as last resort
      return await this.getFallbackTracks(accessToken, limit);
    }
  }

  /**
   * Get recommendations using all genres as seeds
   * @param {string} accessToken - Spotify access token
   * @param {Array<string>} genres - Array of genres to use as seeds
   * @param {number} limit - Number of tracks to return
   * @returns {Promise<Array>} - Array of recommended tracks
   */
  async getRecommendationsWithAllGenres(accessToken, genres, limit) {
    try {
      // Clean up and validate genres
      const validGenres = genres
        .filter(Boolean)
        .slice(0, 5) // Spotify allows maximum 5 seeds total
        .map(genre => genre.toLowerCase().trim().replace(/\s+/g, '-'));

      if (validGenres.length === 0) {
        return [];
      }

      const safeGenres = this.getSafeGenres(validGenres);

      // Create parameters with all genres at once
      const params = new URLSearchParams();
      params.append('limit', limit);
      params.append('seed_genres', safeGenres.join(','));

      // Add timestamp to avoid cached results
      params.append('timestamp', Date.now());

      console.log(`Getting recommendations with all genres: ${safeGenres.join(',')}`);

      const response = await axios.get('https://api.spotify.com/v1/recommendations', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: params
      });

      if (response.data?.tracks?.length > 0) {
        return response.data.tracks;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error getting recommendations with all genres:', error.message);
      return [];
    }
  }

  /**
   * Get recommendations for each genre and mix them together
   * @param {string} accessToken - Spotify access token
   * @param {Array<string>} genres - Array of genres
   * @param {number} limit - Total number of tracks to return
   * @returns {Promise<Array>} - Mixed array of tracks
   */
  async getRecommendationsByGenreMix(accessToken, genres, limit) {
    try {
      // Calculate tracks per genre
      const validGenres = genres.filter(Boolean);
      if (validGenres.length === 0) return [];

      const tracksPerGenre = Math.ceil(limit / validGenres.length);
      let allTracks = [];

      // Get recommendations for each genre individually
      for (const genre of validGenres) {
        try {
          const params = new URLSearchParams();
          params.append('seed_genres', genre);
          params.append('limit', tracksPerGenre);

          // Add timestamp to avoid cached results
          params.append('timestamp', Date.now() % 1000);

          console.log(`Getting recommendations for genre: ${genre}`);

          const response = await axios.get('https://api.spotify.com/v1/recommendations', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            params: params
          });

          if (response.data?.tracks?.length > 0) {
            console.log(`Got ${response.data.tracks.length} tracks for genre "${genre}"`);
            allTracks = allTracks.concat(response.data.tracks);
          }
        } catch (genreError) {
          console.log(`Failed to get recommendations for genre "${genre}":`, genreError.message);
        }
      }

      // Check if we got any tracks
      if (allTracks.length > 0) {
        // Shuffle and limit
        const shuffled = this.shuffleArray(allTracks);
        return shuffled.slice(0, limit);
      }

      return [];
    } catch (error) {
      console.error('Error in genre mix recommendations:', error.message);
      return [];
    }
  }

  /**
   * Use Spotify search API to find tracks by genre
   * @param {string} accessToken - Spotify access token
   * @param {string|Array} genres - Genre(s) to search for
   * @param {number} limit - Number of tracks to return
   * @returns {Promise<Array>} - Array of tracks
   */
  async searchTracksByGenre(accessToken, genres, limit = 20) {
    try {
      // Convert single genre to array for consistency
      const genreArray = Array.isArray(genres) ? genres : [genres];

      // Filter out empty genres
      const validGenres = genreArray.filter(g => g && g.trim() !== '');

      if (validGenres.length === 0) {
        console.log('No valid genres provided for search');
        return [];
      }

      console.log(`Searching for tracks across ${validGenres.length} genres: ${validGenres.join(', ')}`);

      // Calculate how many tracks to fetch per genre
      const tracksPerGenre = Math.ceil(limit / validGenres.length);
      let allTracks = [];

      // Search for each genre and collect results
      for (const genre of validGenres) {
        try {
          // Specific genre search with genre: prefix
          const searchQuery = `genre:${genre}`;
          console.log(`Searching for "${searchQuery}"`);

          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            params: {
              q: searchQuery,
              type: 'track',
              limit: tracksPerGenre
            }
          });

          if (response.data.tracks && response.data.tracks.items.length > 0) {
            console.log(`Found ${response.data.tracks.items.length} tracks for genre "${genre}"`);
            allTracks = allTracks.concat(response.data.tracks.items);
            continue; // Move to next genre if we got results
          }

          // If specific search fails, try broader keyword search
          console.log(`No results for "genre:${genre}", trying general search for "${genre}"`);
          const keywordResponse = await axios.get('https://api.spotify.com/v1/search', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            params: {
              q: genre, // Just use the genre as a keyword
              type: 'track',
              limit: tracksPerGenre
            }
          });

          if (keywordResponse.data.tracks && keywordResponse.data.tracks.items.length > 0) {
            console.log(`Found ${keywordResponse.data.tracks.items.length} tracks with keyword "${genre}"`);
            allTracks = allTracks.concat(keywordResponse.data.tracks.items);
          } else {
            console.log(`No results found for genre "${genre}"`);
          }
        } catch (genreError) {
          console.error(`Error searching for genre "${genre}":`, genreError.message);
          // Continue with other genres
        }
      }

      // Randomize and limit the final results
      if (allTracks.length > 0) {
        console.log(`Found a total of ${allTracks.length} tracks across all genres`);

        // Shuffle the tracks to mix genres
        const shuffledTracks = this.shuffleArray(allTracks);

        // Take only up to the requested limit
        const limitedTracks = shuffledTracks.slice(0, limit);

        console.log(`Returning ${limitedTracks.length} mixed tracks across selected genres`);
        return limitedTracks;
      }

      console.log('No tracks found across any genres');
      return [];
    } catch (error) {
      console.error('Error searching for tracks by genre:', error.message);
      return [];
    }
  }

  /**
   * Get a list of safe genres that should work with Spotify API
   * @param {string[]} userGenres - User selected genres
   * @returns {string[]} - Safe list of genres
   */
  getSafeGenres(userGenres = []) {
    // These are known to be valid Spotify genre seeds
    const validGenres = [
      'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'anime',
      'black-metal', 'bluegrass', 'blues', 'bossanova', 'brazil', 'breakbeat',
      'british', 'cantopop', 'chicago-house', 'children', 'chill', 'classical',
      'club', 'comedy', 'country', 'dance', 'dancehall', 'death-metal', 'deep-house',
      'detroit-techno', 'disco', 'disney', 'drum-and-bass', 'dub', 'dubstep', 'edm',
      'electro', 'electronic', 'emo', 'folk', 'forro', 'french', 'funk', 'garage',
      'german', 'gospel', 'goth', 'grindcore', 'groove', 'grunge', 'guitar',
      'happy', 'hard-rock', 'hardcore', 'hardstyle', 'heavy-metal', 'hip-hop',
      'house', 'idm', 'indian', 'indie', 'indie-pop', 'industrial', 'iranian',
      'j-dance', 'j-idol', 'j-pop', 'j-rock', 'jazz', 'k-pop', 'kids', 'latin',
      'latino', 'malay', 'mandopop', 'metal', 'metal-misc', 'metalcore', 'minimal-techno',
      'mpb', 'new-age', 'new-release', 'opera', 'pagode', 'party', 'piano',
      'pop', 'pop-film', 'post-dubstep', 'power-pop', 'progressive-house', 'psych-rock',
      'punk', 'punk-rock', 'r-n-b', 'rainy-day', 'reggae', 'reggaeton', 'road-trip',
      'rock', 'rock-n-roll', 'rockabilly', 'romance', 'sad', 'salsa', 'samba',
      'sertanejo', 'show-tunes', 'singer-songwriter', 'ska', 'sleep', 'songwriter',
      'soul', 'soundtracks', 'spanish', 'study', 'summer', 'swedish', 'synth-pop',
      'tango', 'techno', 'trance', 'trip-hop', 'turkish', 'work-out', 'world-music'
    ];

    // If no user genres, return some popular ones
    if (!userGenres || userGenres.length === 0) {
      return ['pop', 'rock', 'hip-hop'];
    }

    // Filter user genres to only include valid ones
    const safeGenres = userGenres.filter(genre => validGenres.includes(genre));

    // If none of the user genres are valid, return popular ones
    if (safeGenres.length === 0) {
      console.log('No valid genres found, using defaults');
      return ['pop', 'rock', 'hip-hop'];
    }

    return safeGenres;
  }

  /**
   * Validate that the genre seeds are acceptable to Spotify
   * @param {string} accessToken - Spotify access token
   * @param {string[]} genres - List of genres to validate
   */
  async validateGenreSeeds(accessToken, genres) {
    try {
      const response = await axios({
        method: 'get',
        url: 'https://api.spotify.com/v1/recommendations/available-genre-seeds',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.data && response.data.genres) {
        const availableGenres = response.data.genres;
        const invalidGenres = genres.filter(g => !availableGenres.includes(g));

        if (invalidGenres.length > 0) {
          console.log(`Warning: Invalid genre seeds detected: ${invalidGenres.join(', ')}`);
        }
      }
    } catch (error) {
      console.log('Could not validate genre seeds, continuing anyway');
    }
  }

  /**
   * Simplified recommendation approach when main method fails
   * @param {string} accessToken - Spotify access token
   * @param {number} limit - Number of tracks to request
   * @param {Object} originalOptions - The original options that were passed
   * @returns {Promise<Array>} - Array of tracks
   */
  async getSimplifiedRecommendations(accessToken, limit = 20, originalOptions = {}) {
    const { seedGenres = [] } = originalOptions;

    try {
      // Determine genre approach based on original request
      let attempts = [];

      // If user selected genres, try those first individually
      if (seedGenres && seedGenres.length > 0) {
        for (const genre of seedGenres) {
          if (genre) {
            attempts.push({ seed_genres: genre });
          }
        }
      }

      // Add some generic attempts as backup
      attempts = attempts.concat([
        { seed_genres: 'pop', target_popularity: 80 },
        { seed_genres: 'rock', target_energy: 0.8 },
        { seed_genres: 'hip-hop', target_danceability: 0.8 },
        { seed_genres: 'indie', target_acousticness: 0.6 },
        { seed_genres: 'electronic', target_energy: 0.9 }
      ]);

      // Make each attempt unique by adding timestamp-based randomization
      const timestamp = Date.now();
      for (const params of attempts) {
        try {
          params.limit = limit;
          params.timestamp = timestamp % 1000; // Add some randomization
          console.log(`Trying recommendation with params:`, params);

          const response = await axios({
            method: 'get',
            url: 'https://api.spotify.com/v1/recommendations',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            params: params
          });

          if (response.data?.tracks?.length > 0) {
            console.log(`Success! Received ${response.data.tracks.length} tracks from seed: ${params.seed_genres}`);

            // Log sample tracks for debugging
            const firstThreeTracks = response.data.tracks.slice(0, 3);
            console.log('Sample tracks received:',
              firstThreeTracks.map(t => `"${t.name}" by ${t.artists[0].name}`).join(', '));

            return response.data.tracks;
          }
        } catch (attemptError) {
          console.log(`Attempt failed with params ${JSON.stringify(params)}:`, attemptError.message);
          // Continue to next attempt
        }
      }

      // As a last resort, try to get user's top tracks
      console.log('All recommendation attempts failed, trying user top tracks...');
      return await this.getFallbackTracks(accessToken, limit);
    } catch (error) {
      console.error('All simplified recommendation attempts failed:', error.message);
      return await this.getFallbackTracks(accessToken, limit);
    }
  }

  /**
   * Get fallback tracks when all recommendation methods fail
   * @param {string} accessToken - Spotify access token
   * @param {number} limit - Number of tracks to return
   * @returns {Promise<Array>} Array of tracks
   */
  async getFallbackTracks(accessToken, limit = 20) {
    try {
      console.log('Getting fallback tracks from user top tracks...');

      // Try medium_term first (last 6 months)
      try {
        const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
          params: { time_range: 'medium_term', limit },
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.data?.items?.length > 0) {
          console.log(`Got ${response.data.items.length} fallback tracks from user top tracks (medium_term)`);
          return response.data.items;
        }
      } catch (mediumTermError) {
        console.log('Medium term fallback failed:', mediumTermError.message);
      }

      // If medium_term failed, try short_term (last 4 weeks)
      try {
        const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
          params: { time_range: 'short_term', limit },
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.data?.items?.length > 0) {
          console.log(`Got ${response.data.items.length} fallback tracks from user top tracks (short_term)`);
          return response.data.items;
        }
      } catch (shortTermError) {
        console.log('Short term fallback failed:', shortTermError.message);
      }

      // As a last resort, try to get recently played tracks
      try {
        const recentlyPlayed = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
          params: { limit },
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (recentlyPlayed.data?.items?.length > 0) {
          console.log(`Got ${recentlyPlayed.data.items.length} tracks from recently played`);
          return recentlyPlayed.data.items.map(item => item.track);
        }
      } catch (recentlyPlayedError) {
        console.error('Recently played fallback failed:', recentlyPlayedError.message);
      }

      // If all else fails, return an empty array
      console.log('All track fetching methods failed, returning empty array');
      return [];
    } catch (error) {
      console.error('Error in getFallbackTracks:', error.message);
      return [];
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
        `https://api.spotify.com/v1/me/top/${type}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: params
      }
      );

      return response.data;
    } catch (error) {
      console.error(`Error getting top ${type}:`, error);
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
   * @param {string} accessToken - The access token
   * @param {string} userId - Spotify user ID
   * @param {Object} options - Playlist options (name, description, isPublic)
   * @returns {Promise<Object>} - Created playlist data
   */
  async createPlaylist(accessToken, userId, options = {}) {
    const name = options.name || `Find That Song - ${new Date().toLocaleDateString()}`;
    const description = options.description || 'Created with Find That Song app';
    const isPublic = options.isPublic !== undefined ? options.isPublic : true;

    try {
      console.log(`Creating playlist "${name}" for user ${userId}`);

      const response = await axios.post(
        `https://api.spotify.com/v1/users/${userId}/playlists`,
        {
          name: name,
          description: description,
          public: isPublic
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
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
   * @param {string} accessToken - Spotify access token
   * @param {string} playlistId - Playlist ID
   * @param {Array<string>} trackUris - Track URIs to add
   * @returns {Promise<Object>} - API response
   */
  async addTracksToPlaylist(accessToken, playlistId, trackUris) {
    try {
      // Validate inputs
      if (!Array.isArray(trackUris) || trackUris.length === 0) {
        console.error('No track URIs provided to add to playlist');
        throw new Error('No tracks provided to add to playlist');
      }

      console.log(`Adding ${trackUris.length} tracks to playlist ${playlistId}`);
      console.log('First few URIs:', trackUris.slice(0, 3));

      const response = await axios.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        { uris: trackUris },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
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

  /**
   * Get a user's playlists
   * @param {string} accessToken - Spotify access token
   * @param {number} limit - Maximum number of playlists to return
   * @returns {Promise<Array>} - User's playlists
   */
  async getUserPlaylists(accessToken, limit = 50) {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: { limit }
      });

      console.log(`Retrieved ${response.data.items.length} playlists for user`);
      return response.data.items;
    } catch (error) {
      console.error('Error getting user playlists:', error.message);
      return [];
    }
  }

  /**
   * Check if a playlist with the specified name exists for the user
   * @param {string} accessToken - Spotify access token
   * @param {string} playlistName - Name to search for
   * @returns {Promise<Object|null>} - The existing playlist or null
   */
  async findPlaylistByName(accessToken, playlistName) {
    try {
      if (!playlistName) return null;

      console.log(`Looking for existing playlist named "${playlistName}"`);
      const playlists = await this.getUserPlaylists(accessToken);

      // Case-insensitive comparison to find a matching playlist
      const existingPlaylist = playlists.find(
        playlist => playlist.name.toLowerCase() === playlistName.toLowerCase()
      );

      if (existingPlaylist) {
        console.log(`Found existing playlist with ID: ${existingPlaylist.id}`);
        return existingPlaylist;
      } else {
        console.log(`No existing playlist found with name "${playlistName}"`);
        return null;
      }
    } catch (error) {
      console.error('Error finding playlist by name:', error.message);
      return null;
    }
  }

  /**
   * Get all tracks from a playlist
   * @param {string} accessToken - Spotify access token
   * @param {string} playlistId - Playlist ID
   * @returns {Promise<Array>} - Array of tracks
   */
  async getPlaylistTracks(accessToken, playlistId) {
    try {
      let allTracks = [];
      let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

      // Paginate through all tracks
      while (nextUrl) {
        const response = await axios.get(nextUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.data.items) {
          allTracks = allTracks.concat(response.data.items.map(item => item.track));
        }

        nextUrl = response.data.next;
      }

      console.log(`Retrieved ${allTracks.length} tracks from playlist ${playlistId}`);
      return allTracks;
    } catch (error) {
      console.error('Error getting playlist tracks:', error.message);
      return [];
    }
  }

  /**
   * Filter out tracks that already exist in the playlist
   * @param {Array} newTracks - Array of new tracks to add
   * @param {Array} existingTracks - Array of tracks already in the playlist
   * @returns {Array} - Array of filtered tracks
   */
  filterDuplicateTracks(newTracks, existingTracks) {
    if (!existingTracks || existingTracks.length === 0) {
      return newTracks;
    }

    // Create a set of existing track URIs for faster lookup
    const existingTrackUris = new Set(
      existingTracks.map(track => track.uri).filter(Boolean)
    );

    console.log(`Filtering against ${existingTrackUris.size} existing tracks`);

    // Filter out tracks that already exist in the playlist
    const uniqueTracks = newTracks.filter(track => {
      return track && track.uri && !existingTrackUris.has(track.uri);
    });

    console.log(`Found ${uniqueTracks.length} new unique tracks out of ${newTracks.length} tracks`);
    return uniqueTracks;
  }

  /**
   * Get audio features for a track
   * @param {string} accessToken - Spotify access token
   * @param {string} trackId - Track ID
   * @returns {Promise<Object>} - Audio features
   */
  async getTrackAudioFeatures(accessToken, trackId) {
    try {
      console.log(`Getting audio features for track: ${trackId}`);

      try {
        const response = await axios.get(`https://api.spotify.com/v1/audio-features/${trackId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        return response.data;
      } catch (error) {
        if (error.response && error.response.status === 403) {
          console.log('Audio features not available for this track (403 Forbidden)');
          return null;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error getting track audio features:', error.message);
      return null;
    }
  }

  /**
   * Get audio analysis for a track
   * @param {string} accessToken - Spotify access token
   * @param {string} trackId - Track ID
   * @returns {Promise<Object>} - Audio analysis
   */
  async getTrackAudioAnalysis(accessToken, trackId) {
    try {
      console.log(`Getting audio analysis for track: ${trackId}`);

      const response = await axios.get(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting track audio analysis:', error.message);
      throw error;
    }
  }

  /**
   * Get a simplified version of audio analysis for a track
   * @param {string} accessToken - Spotify access token
   * @param {string} trackId - Track ID
   * @returns {Promise<Object>} - Simplified audio analysis
   */
  async getSimplifiedAudioAnalysis(accessToken, trackId) {
    try {
      console.log(`Getting simplified audio analysis for track: ${trackId}`);

      try {
        const response = await axios.get(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        // Extract only the necessary information to reduce payload size
        const data = response.data;
        return {
          duration: data.track.duration,
          tempo: data.track.tempo,
          time_signature: data.track.time_signature,
          key: data.track.key,
          mode: data.track.mode,
          sections_count: data.sections.length,
          segments_count: data.segments.length,
          bars_count: data.bars.length,
          beats_count: data.beats.length
        };
      } catch (error) {
        if (error.response && error.response.status === 403) {
          console.log('Audio analysis not available for this track (403 Forbidden)');
          return null;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error getting simplified track audio analysis:', error.message);
      return null;
    }
  }

  /**
   * Get track details
   * @param {string} accessToken - Spotify access token
   * @param {string} trackId - Track ID
   * @returns {Promise<Object>} - Track details
   */
  async getTrack(accessToken, trackId) {
    try {
      console.log(`Getting track details for: ${trackId}`);

      const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      return response.data;
    } catch (error) {
      console.error('Error getting track details:', error.message);
      throw error;
    }
  }

  /**
   * Get comprehensive track analysis including track details, audio features, and simplified analysis
   * @param {string} accessToken - Spotify access token
   * @param {string} trackId - Track ID
   * @returns {Promise<Object>} - Comprehensive track analysis
   */
  async getTrackAnalysis(accessToken, trackId) {
    try {
      // Get track details, audio features, and audio analysis in parallel
      const [track, audioFeatures, audioAnalysis] = await Promise.all([
        this.getTrack(accessToken, trackId),
        this.getTrackAudioFeatures(accessToken, trackId),
        this.getTrackAudioAnalysis(accessToken, trackId).catch(error => {
          // Audio analysis can be heavy, so handle failure gracefully
          console.warn('Audio analysis failed, continuing without it:', error.message);
          return null;
        })
      ]);

      // Prepare a simplified version of the audio analysis (which can be very large)
      const simplifiedAnalysis = audioAnalysis ? {
        duration: audioAnalysis.track.duration,
        tempo: audioAnalysis.track.tempo,
        time_signature: audioAnalysis.track.time_signature,
        key: audioAnalysis.track.key,
        mode: audioAnalysis.track.mode,
        sections_count: audioAnalysis.sections.length,
        segments_count: audioAnalysis.segments.length,
        bars_count: audioAnalysis.bars.length,
        beats_count: audioAnalysis.beats.length
      } : null;

      return {
        track,
        audioFeatures,
        analysis: simplifiedAnalysis
      };
    } catch (error) {
      console.error('Error in getTrackAnalysis:', error.message);
      throw error;
    }
  }
}

module.exports = new SpotifyService();
