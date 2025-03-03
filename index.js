const express = require('express');
const path = require('path');
require('dotenv').config();
const spotifyService = require('./services/spotify');
const expressLayouts = require('express-ejs-layouts');

const app = express();
const port = process.env.PORT || 3000;

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
  const access_token = req.query.access_token || req.body.access_token;

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

      // Filter out any empty values
      seedGenres = seedGenres.filter(g => g && g.trim() !== '');
      console.log(`Using genre seeds: ${seedGenres.join(', ')}`);
    } else {
      // Default genres if none selected
      seedGenres = ['pop', 'rock', 'hip-hop'];
      console.log('No genres selected, using default genres');
    }

    let tracks = [];

    try {
      // Get recommendations based on genres
      console.log('Requesting recommendations...');
      tracks = await spotifyService.getRecommendations(access_token, {
        seedGenres,
        limit: parseInt(track_count) || 20
      });

      console.log(`Got ${tracks.length} tracks from recommendations or search`);

      // If we still don't have tracks, try search as a last resort
      if (!tracks || tracks.length === 0) {
        console.log('Trying direct search for tracks by genre');
        tracks = await spotifyService.searchTracksByGenre(access_token, seedGenres[0], parseInt(track_count) || 20);
        console.log(`Got ${tracks.length} tracks from search`);
      }
    } catch (seedError) {
      console.error('Error getting recommendations:', seedError);
      // Try to get fallback tracks directly
      console.log('Getting fallback tracks...');
      tracks = await spotifyService.getFallbackTracks(access_token, parseInt(track_count) || 20);
      console.log(`Got ${tracks.length} fallback tracks`);
    }

    // Check if we have any tracks before proceeding
    if (!tracks || tracks.length === 0) {
      console.log("No tracks returned from any recommendation or fallback method");
      throw new Error("Could not find any tracks for your playlist. Please try different genres or try again later.");
    }

    // Create the playlist with explicit access token
    const playlistData = await spotifyService.createPlaylist(access_token, userId, {
      name: playlist_name || `Find That Song - ${new Date().toLocaleDateString()}`,
      description: playlist_description || 'Created with Find That Song app',
      isPublic: isPublic === 'true'
    });

    // Verify tracks have valid URIs before attempting to add them
    const validTracks = tracks.filter(track => track && track.uri);
    console.log(`Found ${validTracks.length} valid tracks with URIs out of ${tracks.length} total tracks`);

    if (validTracks.length === 0) {
      throw new Error("No valid track URIs found to add to the playlist.");
    }

    // Add tracks to the playlist with explicit access token
    const trackUris = validTracks.map(track => track.uri);
    await spotifyService.addTracksToPlaylist(access_token, playlistData.id, trackUris);

    // Log playlist creation success with track details
    console.log(`Playlist created successfully with ${validTracks.length} tracks`);
    console.log('First few tracks:', validTracks.slice(0, 3).map(t =>
      `"${t.name}" by ${t.artists.map(a => a.name).join(', ')}`
    ).join('; '));

    // Render success page
    res.render('playlist-success', {
      title: 'Playlist Created',
      tracks: validTracks,
      playlistData,
      playlist_name: playlistData.name,
      access_token
    });

  } catch (error) {
    console.error('Error in playlist creation process:', error);

    // Enhanced error reporting
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