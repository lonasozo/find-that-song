const express = require('express');
const path = require('path');
// Modifichiamo il caricamento di dotenv per specificare esplicitamente il file .env.local
require('dotenv').config({ path: path.join(__dirname, '.env.local') });
const spotifyService = require('./services/spotify');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const port = process.env.PORT || 3000;

// Determinazione dell'ambiente
const isVercelProd = process.env.VERCEL_ENV === 'production';
const isVercelDev = process.env.VERCEL_ENV === 'development' || process.env.VERCEL_ENV === 'preview';
// Forziamo development quando eseguiamo in locale
const nodeEnv = (process.env.NODE_ENV === 'production' && !isVercelProd) ? 'development' : (process.env.NODE_ENV || 'development');
const actualEnv = isVercelProd ? 'production' : (isVercelDev ? 'vercel-dev' : nodeEnv);

// Log delle variabili d'ambiente
console.log('-------------------------------------');
console.log(`🌍 Avvio applicazione in ambiente: ${actualEnv}`);
console.log('📋 Variabili d\'ambiente:');
console.log(`   - NODE_ENV: ${nodeEnv}`);
console.log(`   - VERCEL_ENV: ${process.env.VERCEL_ENV || 'non impostato'}`);
console.log('🎵 Credenziali Spotify:');
console.log(`   - CLIENT_ID: ${process.env.SPOTIFY_CLIENT_ID ? '✓ impostato' : '❌ mancante'} (${process.env.SPOTIFY_CLIENT_ID ? process.env.SPOTIFY_CLIENT_ID.substring(0, 5) + '...' : 'undefined'})`);
console.log(`   - CLIENT_SECRET: ${process.env.SPOTIFY_CLIENT_SECRET ? '✓ impostato' : '❌ mancante'}`);
console.log(`   - REDIRECT_URI: ${process.env.SPOTIFY_REDIRECT_URI || 'non impostato'}`);
console.log('-------------------------------------');

// Configure express to use EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Configure static files
app.use(express.static(path.join(__dirname, 'public')));

// Add a logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});



// Parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper function to render error pages
function renderErrorPage(res, title, error, accessToken) {
  const isAjax = res.req.query.ajax === 'true';

  if (isAjax) {
    return res.render('error', {
      title,
      message: error.message,
      details: error.response?.data?.error?.message || error.message,
      status: error.response?.data?.error?.status || '',
      step: error.step || 'unknown',
      accessToken,
      layout: false
    });
  } else {
    return res.render('error', {
      title,
      message: error.message,
      details: error.response?.data?.error?.message || error.message,
      status: error.response?.data?.error?.status || '',
      step: error.step || 'unknown',
      accessToken
    });
  }
}

// Helper function to check for access token
function checkAccessToken(req, res, next) {
  console.log('checkAccessToken middleware executing for path:', req.path);
  const access_token = req.query.access_token || req.body.access_token;

  console.log('Access token found:', access_token ? 'Yes (length: ' + access_token.length + ')' : 'No');

  if (!access_token) {
    console.log('No access token provided. Redirecting to homepage...');
    return res.redirect('/');
  }

  next();
}

// Routes
app.get('/', (req, res) => {
  res.render('home', { title: 'Home', layout: false });
});

app.get('/login', (req, res) => {
  const scope = 'user-read-recently-played user-top-read playlist-modify-public playlist-modify-private';
  res.redirect(spotifyService.getAuthorizationUrl(scope));
});

app.get('/callback', async (req, res) => {
  const code = req.query.code || null;

  try {
    const tokenData = await spotifyService.getAccessToken(code);
    const access_token = tokenData.access_token;
    res.redirect('/top-artists?access_token=' + access_token);
  } catch (error) {
    renderErrorPage(res, "Authorization Error", error);
  }
});

app.get('/recently-played', checkAccessToken, async (req, res) => {
  const access_token = req.query.access_token;
  const isAjax = req.query.ajax === 'true';

  try {
    const items = await spotifyService.getRecentlyPlayed(access_token, 10);
    res.render('recently-played', {
      title: 'Recently Played',
      items,
      access_token,
      layout: !isAjax
    });
  } catch (error) {
    renderErrorPage(res, "Error Retrieving Tracks", error, access_token);
  }
});

app.get('/top-tracks', checkAccessToken, async (req, res) => {
  const access_token = req.query.access_token;
  const time_range = req.query.time_range || 'medium_term';
  const isAjax = req.query.ajax === 'true';

  try {
    const tracks = await spotifyService.getTopTracks(access_token, time_range);

    // If this is an AJAX request, we only send the content part
    if (isAjax) {
      return res.render('top-tracks', {
        tracks,
        time_range,
        access_token,
        layout: false
      });
    }

    // Otherwise we send the full page
    res.render('top-tracks', {
      title: 'Top Tracks',
      tracks,
      access_token,
      time_range,
      layout: true
    });
  } catch (error) {
    console.error('Error fetching top tracks:', error);

    if (isAjax) {
      return res.status(500).send('<div class="error-message">Error loading tracks. Please try again.</div>');
    }

    renderErrorPage(res, "Error Retrieving Top Tracks", error, access_token);
  }
});

app.get('/top-artists', checkAccessToken, async (req, res) => {
  const access_token = req.query.access_token;
  const time_range = req.query.time_range || 'medium_term';
  const isAjax = req.query.ajax === 'true';

  try {
    const artists = await spotifyService.getTopArtists(access_token, time_range);
    res.render('top-artists', {
      title: 'Top Artists',
      artists,
      access_token,
      time_range,
      layout: !isAjax
    });
  } catch (error) {
    renderErrorPage(res, "Error Retrieving Top Artists", error, access_token);
  }
});

app.get('/top-albums', checkAccessToken, async (req, res) => {
  const access_token = req.query.access_token;
  const time_range = req.query.time_range || 'medium_term';
  const isAjax = req.query.ajax === 'true';

  try {
    const tracks = await spotifyService.getTopTracks(access_token, time_range);

    // Extract and count albums
    const albumMap = new Map();

    tracks.forEach(track => {
      const album = track.album;
      if (!albumMap.has(album.id)) {
        album.count = 1;
        album.artists = track.album.artists;
        albumMap.set(album.id, album);
      } else {
        albumMap.get(album.id).count += 1;
      }
    });

    // Convert map to array and sort by count
    const albums = Array.from(albumMap.values()).sort((a, b) => b.count - a.count);

    res.render('top-albums', {
      title: 'Top Albums',
      albums,
      access_token,
      time_range,
      layout: !isAjax
    });
  } catch (error) {
    renderErrorPage(res, "Error Retrieving Top Albums", error, access_token);
  }
});

app.get('/generate-playlist', checkAccessToken, (req, res) => {
  const access_token = req.query.access_token;
  const isAjax = req.query.ajax === 'true';

  res.render('generate-playlist', {
    title: 'Generate Playlist',
    access_token,
    defaultPlaylistName: `Find That Song - ${new Date().toLocaleDateString()}`,
    layout: !isAjax
  });
});

app.post('/create-playlist', checkAccessToken, async (req, res) => {
  try {
    const {
      access_token,
      playlist_name,
      playlist_description,
      genres,
      track_count,
      timestamp, // Timestamp for ensuring variety
      public: isPublic
    } = req.body;

    console.log("Starting playlist creation process with:", {
      name: playlist_name,
      type: 'genres', // Always genre-based now
      trackCount: track_count,
      genres: genres ? (Array.isArray(genres) ? genres.join(', ') : genres) : 'none',
      timestamp: timestamp || Date.now() // Use timestamp if provided, otherwise current time
    });

    // Get user profile with the access token explicitly passed
    const user = await spotifyService.getUserProfile(access_token);
    const userId = user.id;

    // Process genre selections - ensure it's an array
    let seedGenres = [];
    if (genres) {
      seedGenres = Array.isArray(genres) ? genres : [genres];
      seedGenres = seedGenres.filter(g => g && g.trim() !== '');
      console.log(`Using genre seeds: ${seedGenres.join(', ')}`);
    } else {
      seedGenres = ['pop', 'rock', 'hip-hop'];
      console.log('No genres selected, using default genres');
    }

    let tracks = [];

    try {
      // Get recommendations based on genres
      tracks = await spotifyService.getRecommendations(access_token, {
        seedGenres,
        limit: parseInt(track_count) || 20
      });

      if (!tracks || tracks.length === 0) {
        // If recommendations fail, try search
        tracks = await spotifyService.searchTracksByGenre(access_token, seedGenres, parseInt(track_count) || 20);
      }
    } catch (seedError) {
      console.error('Error getting seeds or recommendations:', seedError);
      // Try fallback tracks
      tracks = await spotifyService.getFallbackTracks(access_token, parseInt(track_count) || 20);
    }

    // Check if we have any tracks before proceeding
    if (!tracks || tracks.length === 0) {
      throw new Error("Could not find any tracks for your playlist. Please try different genres or try again later.");
    }

    // Make sure all tracks have valid URIs - Change from const to let so we can reassign it later
    let validTracks = tracks.filter(track => track && track.uri);

    if (validTracks.length === 0) {
      throw new Error("No valid track URIs found to add to the playlist.");
    }

    // Check if a playlist with this name already exists
    let playlistData;
    let existingPlaylist = await spotifyService.findPlaylistByName(access_token, playlist_name);
    let isNewPlaylist = false;

    if (existingPlaylist) {
      console.log(`Using existing playlist "${playlist_name}" (${existingPlaylist.id})`);
      playlistData = existingPlaylist;

      // Get current tracks in the playlist to avoid duplicates
      const existingTracks = await spotifyService.getPlaylistTracks(access_token, existingPlaylist.id);

      // Filter out tracks that already exist in the playlist
      const uniqueTracks = spotifyService.filterDuplicateTracks(validTracks, existingTracks);

      // If there are any new tracks to add
      if (uniqueTracks.length > 0) {
        // Add only unique tracks to the existing playlist
        const trackUris = uniqueTracks.map(track => track.uri);
        await spotifyService.addTracksToPlaylist(access_token, existingPlaylist.id, trackUris);
        console.log(`Added ${uniqueTracks.length} new tracks to existing playlist`);

        // Use the unique tracks for display on the success page
        validTracks = uniqueTracks;
      } else {
        console.log('No new unique tracks to add to the playlist');
      }
    } else {
      // Create a new playlist
      isNewPlaylist = true;
      playlistData = await spotifyService.createPlaylist(access_token, userId, {
        name: playlist_name || `Find That Song - ${new Date().toLocaleDateString()}`,
        description: playlist_description || 'Created with Find That Song app',
        isPublic: isPublic === 'true'
      });

      // Add all tracks to the new playlist
      const trackUris = validTracks.map(track => track.uri);
      await spotifyService.addTracksToPlaylist(access_token, playlistData.id, trackUris);
      console.log(`Created new playlist with ${validTracks.length} tracks`);
    }

    // Render success page
    res.render('playlist-success', {
      title: 'Playlist Created',
      tracks: validTracks,
      playlistData,
      playlist_name: playlistData.name,
      access_token,
      isNewPlaylist,
      updatedExisting: !isNewPlaylist
    });

  } catch (error) {
    console.error('Error in playlist creation process:', error);
    const errorDetails = {
      message: error.message,
      statusCode: error.response?.status,
      spotifyError: error.response?.data?.error || {},
      stack: error.stack
    };
    console.error('Detailed error information:', JSON.stringify(errorDetails, null, 2));
    renderErrorPage(res, "Error Creating Playlist", error, req.body.access_token);
  }
});

app.get('/track-analysis/:trackId', checkAccessToken, async (req, res) => {

  return false;
  console.log('TRACK ANALYSIS ROUTE HIT - Track ID:', req.params.trackId);
  const access_token = req.query.access_token;
  const { trackId } = req.params;

  try {
    console.log(`Starting track analysis for track ${trackId} with token length: ${access_token.length}`);

    // First try to get just the track details, which should always work
    console.log('Getting track details...');
    const track = await spotifyService.getTrack(access_token, trackId);
    console.log('Track details retrieved successfully:', track.name);

    // Then try to get audio features and analysis, but handle errors gracefully
    let audioFeatures = null;
    let analysis = null;

    try {
      // Try to get audio features
      console.log('Getting audio features...');
      audioFeatures = await spotifyService.getTrackAudioFeatures(access_token, trackId);
      console.log('Audio features retrieved successfully');
    } catch (featuresError) {
      console.log(`Audio features not available for track ${trackId}: ${featuresError.message}`);
    }

    try {
      // Try to get audio analysis if we have features (it's a heavier operation)
      if (audioFeatures) {
        console.log('Getting audio analysis...');
        analysis = await spotifyService.getSimplifiedAudioAnalysis(access_token, trackId);
        console.log('Audio analysis retrieved successfully');
      }
    } catch (analysisError) {
      console.log(`Audio analysis not available for track ${trackId}: ${analysisError.message}`);
    }

    // Render the page with whatever data we have
    console.log('Rendering track analysis page with data:', {
      hasTrack: !!track,
      hasAudioFeatures: !!audioFeatures,
      hasAnalysis: !!analysis
    });

    res.render('track-analysis', {
      title: 'Track Analysis',
      track: track,
      audioFeatures: audioFeatures,
      analysis: analysis,
      access_token,
      analysisError: audioFeatures === null // Flag to indicate if analysis data is missing
    });
  } catch (error) {
    // If even basic track info fails, then show an error page
    console.error('Error retrieving track analysis:', error);
    renderErrorPage(res, "Error Analyzing Track", error, access_token);
  }
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add a catch-all route for debugging (place at the end before module.exports)
app.use((req, res, next) => {
  console.log(`No route matched for: ${req.method} ${req.path}`);
  next(); // This will likely result in a 404 response
});

// Handling uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// For the environment Vercel serverless
module.exports = app;

// Only for the local development environment, not executed in Vercel
if (process.env.NODE_ENV !== 'production') {
  const server = app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
  });

  // Handle graceful shutdown
  const gracefulShutdown = () => {
    console.log('Shutting down gracefully...');
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });

    // Force close if it takes too long
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  // Listen for termination signals
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}