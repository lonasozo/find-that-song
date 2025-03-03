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
      seed_type,
      genres,
      time_range,
      track_count,
      public: isPublic
    } = req.body;

    console.log("Starting playlist creation process with:", {
      name: playlist_name,
      type: seed_type,
      track_count
    });

    // Get user profile
    const user = await spotifyService.getUserProfile(access_token);
    const userId = user.id;

    // Get seed data based on selection
    let seedTracks = [], seedArtists = [], seedGenres = [];

    if (seed_type === 'top_tracks') {
      // Get top tracks for seeds
      const topTracks = await spotifyService.getTopTracks(access_token, time_range, 10);
      seedTracks = topTracks.slice(0, 5).map(track => track.id);
    }
    else if (seed_type === 'top_artists') {
      // Get top artists for seeds
      const topArtists = await spotifyService.getTopArtists(access_token, time_range, 5);
      seedArtists = topArtists.map(artist => artist.id);
    }
    else if (seed_type === 'genres') {
      // Process genre selections
      seedGenres = Array.isArray(genres) ? genres.slice(0, 5) : [genres];
    }

    // Get track recommendations
    let tracks = [];
    try {
      tracks = await spotifyService.getRecommendations(access_token, {
        seedTracks,
        seedArtists,
        seedGenres,
        limit: track_count
      });
    } catch (error) {
      // Fallback to using top tracks directly if recommendations fail
      if (seed_type === 'top_tracks') {
        console.log("Using top tracks as fallback");
        tracks = await spotifyService.getTopTracks(access_token, time_range, track_count);
      } else {
        throw error;
      }
    }

    // Create the playlist
    const playlistData = await spotifyService.createPlaylist(access_token, userId, {
      name: playlist_name,
      description: playlist_description,
      isPublic: isPublic === 'true'
    });

    // Add tracks to the playlist
    const trackUris = tracks.map(track => track.uri);
    await spotifyService.addTracksToPlaylist(access_token, playlistData.id, trackUris);

    // Render success page
    res.render('playlist-success', {
      tracks,
      playlistData,
      playlist_name,
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