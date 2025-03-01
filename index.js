const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configurazione per servire file statici dalla cartella public
app.use(express.static(path.join(__dirname, 'public')));

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

// Aggiungiamo un middleware di logging per il debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Find That Song - Spotify Recently Played</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="/css/home.css">
      </head>
      <body>
        <h1>Find That Song</h1>
        <a href="/login" class="login-button">LOGIN with Spotify</a>
        <div class="description">
          <p>Missed the moment and didn't save your favorite song? Check your recent listens on Spotify</p>
          <p>Also discover your top tracks and artists over different time periods!</p>
        </div>
      </body>
    </html>
  `);
});

app.get('/login', (req, res) => {
  const scope = 'user-read-recently-played user-top-read playlist-modify-public playlist-modify-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri
    }));
});

app.get('/callback', (req, res) => {
  const code = req.query.code || null;
  axios.post('https://accounts.spotify.com/api/token', querystring.stringify({
    code: code,
    redirect_uri: redirect_uri,
    grant_type: 'authorization_code'
  }), {
    headers: {
      'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')),
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(response => {
    const access_token = response.data.access_token;
    res.redirect('/recently-played?access_token=' + access_token);
  }).catch(error => {
    res.send(error);
  });
});

app.get('/recently-played', (req, res) => {
  const access_token = req.query.access_token;
  axios.get('https://api.spotify.com/v1/me/player/recently-played', {
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  }).then(response => {
    const items = response.data.items;
    let html = `
    <html>
      <head>
        <title>Recently Played Songs</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="/css/tracks.css">
      </head>
      <body>
        <div class="tracks-container">
          <header>
            <h1>Recently Played Tracks</h1>
            <div class="nav-links">
              <a href="/" class="home-link">Home</a>
              <a href="/top-tracks?access_token=${access_token}" class="nav-link">Top Tracks</a>
              <a href="/top-artists?access_token=${access_token}" class="nav-link">Top Artists</a>
              <a href="/top-albums?access_token=${access_token}" class="nav-link">Top Albums</a>
              <a href="/generate-playlist?access_token=${access_token}" class="nav-link">Generate Playlist</a>
            </div>
          </header>
          <div class="tracks-list">
    `;

    items.forEach(item => {
      const track = item.track;
      const album = track.album;
      const playedAt = new Date(item.played_at);
      const formattedDate = playedAt.toLocaleString();

      html += `
        <div class="track-item">
          <a href="${track.external_urls.spotify}" target="_blank" title="Play ${track.name} on Spotify">
            <img src="${album.images[2]?.url || album.images[0].url}" alt="${album.name}" class="album-img" />
          </a>
          <div class="track-info">
            <div class="track-name">${track.name}</div>
            <div class="artist-name">
              ${track.artists.map(artist =>
        `<a href="${artist.external_urls.spotify}" target="_blank" class="artist-link">${artist.name}</a>`
      ).join(', ')}
            </div>
            <div class="album-name">
              <a href="${album.external_urls.spotify}" target="_blank" class="album-link">${album.name}</a>
            </div>
          </div>
          <div class="track-meta">
            <div>${formattedDate}</div>
            <a href="${track.external_urls.spotify}" class="spotify-link" target="_blank">Play</a>
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </body>
    </html>
    `;

    res.send(html);
  }).catch(error => {
    res.send(`
      <html>
        <head>
          <title>Error</title>
          <link rel="stylesheet" href="/css/error.css">
        </head>
        <body>
          <div class="error-container">
            <h1>Error Retrieving Tracks</h1>
            <p>Something went wrong when trying to fetch your recently played tracks.</p>
            <p>Error details: ${error.message}</p>
            <a href="/" class="home-link">Return to Home</a>
          </div>
        </body>
      </html>
    `);
  });
});

// Add Top Tracks endpoint
app.get('/top-tracks', (req, res) => {
  const access_token = req.query.access_token;
  const time_range = req.query.time_range || 'medium_term'; // default to 6 months

  axios.get(`https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=50`, {
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  }).then(response => {
    const tracks = response.data.items;
    let html = `
    <html>
      <head>
        <title>Your Top Tracks</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="/css/tracks.css">
      </head>
      <body>
        <div class="tracks-container">
          <header>
            <h1>Your Top Tracks</h1>
            <div class="nav-links">
              <a href="/" class="home-link">Home</a>
              <a href="/recently-played?access_token=${access_token}" class="nav-link">Recently Played</a>
              <a href="/top-artists?access_token=${access_token}" class="nav-link">Top Artists</a>
              <a href="/top-albums?access_token=${access_token}" class="nav-link">Top Albums</a>
              <a href="/generate-playlist?access_token=${access_token}" class="nav-link">Generate Playlist</a>
            </div>
          </header>
          
          <div class="time-filter">
            <a href="/top-tracks?access_token=${access_token}&time_range=short_term" class="${time_range === 'short_term' ? 'active' : ''}">Last 4 Weeks</a>
            <a href="/top-tracks?access_token=${access_token}&time_range=medium_term" class="${time_range === 'medium_term' ? 'active' : ''}">Last 6 Months</a>
            <a href="/top-tracks?access_token=${access_token}&time_range=long_term" class="${time_range === 'long_term' ? 'active' : ''}">All Time</a>
          </div>
          
          <div class="tracks-list">
    `;

    tracks.forEach((track, index) => {
      const album = track.album;

      html += `
        <div class="track-item">
          <div class="track-rank">${index + 1}</div>
          <a href="${track.external_urls.spotify}" target="_blank" title="Play ${track.name} on Spotify">
            <img src="${album.images[2]?.url || album.images[0].url}" alt="${album.name}" class="album-img" />
          </a>
          <div class="track-info">
            <div class="track-name">${track.name}</div>
            <div class="artist-name">
              ${track.artists.map(artist =>
        `<a href="${artist.external_urls.spotify}" target="_blank" class="artist-link">${artist.name}</a>`
      ).join(', ')}
            </div>
            <div class="album-name">
              <a href="${album.external_urls.spotify}" target="_blank" class="album-link">${album.name}</a>
            </div>
          </div>
          <div class="track-meta">
            <a href="${track.external_urls.spotify}" class="spotify-link" target="_blank">Play</a>
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </body>
    </html>
    `;

    res.send(html);
  }).catch(error => {
    res.send(`
      <html>
        <head>
          <title>Error</title>
          <link rel="stylesheet" href="/css/error.css">
        </head>
        <body>
          <div class="error-container">
            <h1>Error Retrieving Top Tracks</h1>
            <p>Something went wrong when trying to fetch your top tracks.</p>
            <p>Error details: ${error.message}</p>
            <a href="/" class="home-link">Return to Home</a>
          </div>
        </body>
      </html>
    `);
  });
});

// Add Top Artists endpoint
app.get('/top-artists', (req, res) => {
  const access_token = req.query.access_token;
  const time_range = req.query.time_range || 'medium_term'; // default to 6 months

  axios.get(`https://api.spotify.com/v1/me/top/artists?time_range=${time_range}&limit=50`, {
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  }).then(response => {
    const artists = response.data.items;
    let html = `
    <html>
      <head>
        <title>Your Top Artists</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="/css/artists.css">
      </head>
      <body>
        <div class="artists-container">
          <header>
            <h1>Your Top Artists</h1>
            <div class="nav-links">
              <a href="/" class="home-link">Home</a>
              <a href="/recently-played?access_token=${access_token}" class="nav-link">Recently Played</a>
              <a href="/top-tracks?access_token=${access_token}" class="nav-link">Top Tracks</a>
              <a href="/top-albums?access_token=${access_token}" class="nav-link">Top Albums</a>
              <a href="/generate-playlist?access_token=${access_token}" class="nav-link">Generate Playlist</a>
            </div>
          </header>
          
          <div class="time-filter">
            <a href="/top-artists?access_token=${access_token}&time_range=short_term" class="${time_range === 'short_term' ? 'active' : ''}">Last 4 Weeks</a>
            <a href="/top-artists?access_token=${access_token}&time_range=medium_term" class="${time_range === 'medium_term' ? 'active' : ''}">Last 6 Months</a>
            <a href="/top-artists?access_token=${access_token}&time_range=long_term" class="${time_range === 'long_term' ? 'active' : ''}">All Time</a>
          </div>
          
          <div class="artists-grid">
    `;

    artists.forEach((artist, index) => {
      html += `
        <div class="artist-card">
          <div class="artist-rank">${index + 1}</div>
          <a href="${artist.external_urls.spotify}" target="_blank">
            <img src="${artist.images[1]?.url || artist.images[0]?.url}" alt="${artist.name}" class="artist-img" />
            <div class="artist-name">${artist.name}</div>
          </a>
          <div class="artist-genres">${artist.genres.slice(0, 3).join(', ')}</div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </body>
    </html>
    `;

    res.send(html);
  }).catch(error => {
    res.send(`
      <html>
        <head>
          <title>Error</title>
          <link rel="stylesheet" href="/css/error.css">
        </head>
        <body>
          <div class="error-container">
            <h1>Error Retrieving Top Artists</h1>
            <p>Something went wrong when trying to fetch your top artists.</p>
            <p>Error details: ${error.message}</p>
            <a href="/" class="home-link">Return to Home</a>
          </div>
        </body>
      </html>
    `);
  });
});

// Add Top Albums endpoint
app.get('/top-albums', (req, res) => {
  const access_token = req.query.access_token;
  const time_range = req.query.time_range || 'medium_term'; // default to 6 months

  // Fetch user's top tracks to extract album information
  axios.get(`https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=50`, {
    headers: {
      'Authorization': 'Bearer ' + access_token
    }
  }).then(response => {
    const tracks = response.data.items;

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

    let html = `
    <html>
      <head>
        <title>Your Top Albums</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="/css/albums.css">
      </head>
      <body>
        <div class="albums-container">
          <header>
            <h1>Your Top Albums</h1>
            <div class="nav-links">
              <a href="/" class="home-link">Home</a>
              <a href="/recently-played?access_token=${access_token}" class="nav-link">Recently Played</a>
              <a href="/top-tracks?access_token=${access_token}" class="nav-link">Top Tracks</a>
              <a href="/top-artists?access_token=${access_token}" class="nav-link">Top Artists</a>
              <a href="/generate-playlist?access_token=${access_token}" class="nav-link">Generate Playlist</a>
            </div>
          </header>
          
          <div class="time-filter">
            <a href="/top-albums?access_token=${access_token}&time_range=short_term" class="${time_range === 'short_term' ? 'active' : ''}">Last 4 Weeks</a>
            <a href="/top-albums?access_token=${access_token}&time_range=medium_term" class="${time_range === 'medium_term' ? 'active' : ''}">Last 6 Months</a>
            <a href="/top-albums?access_token=${access_token}&time_range=long_term" class="${time_range === 'long_term' ? 'active' : ''}">All Time</a>
          </div>
          
          <div class="albums-grid">
    `;

    albums.forEach((album, index) => {
      // Create a shortened version of the artists list
      let artistsText = album.artists.map(artist => artist.name).join(', ');
      let displayArtistsText = artistsText;

      if (artistsText.length > 25) {
        displayArtistsText = artistsText.substring(0, 22) + '...';
      }

      html += `
        <div class="album-card">
          <div class="album-rank">${index + 1}</div>
          <a href="${album.external_urls.spotify}" target="_blank">
            <img src="${album.images[1]?.url || album.images[0]?.url}" alt="${album.name}" class="album-img" />
            <div class="album-name">${album.name}</div>
          </a>
          <div class="artist-name" title="${artistsText}">
            ${displayArtistsText}
          </div>
          <div class="album-info">
            <span class="album-year">${album.release_date ? new Date(album.release_date).getFullYear() : 'N/A'}</span>
            <span class="album-tracks">${album.total_tracks} tracks</span>
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </body>
    </html>
    `;

    res.send(html);
  }).catch(error => {
    res.send(`
      <html>
        <head>
          <title>Error</title>
          <link rel="stylesheet" href="/css/error.css">
        </head>
        <body>
          <div class="error-container">
            <h1>Error Retrieving Top Albums</h1>
            <p>Something went wrong when trying to fetch your top albums.</p>
            <p>Error details: ${error.message}</p>
            <a href="/" class="home-link">Return to Home</a>
          </div>
        </body>
      </html>
    `);
  });
});

// Add Playlist Generator form endpoint
app.get('/generate-playlist', (req, res) => {
  const access_token = req.query.access_token;

  let html = `
  <html>
    <head>
      <title>Playlist Generator</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link rel="stylesheet" href="/css/playlist-generator.css">
      <style>
        /* Custom styling for multi-select dropdown */
        select[multiple] {
          height: auto;
          min-height: 100px;
          background-image: none;
          padding: 8px;
        }
        select[multiple] option {
          padding: 8px;
          margin-bottom: 3px;
          border-radius: 4px;
          background-color: #f0f0f0;
          color: #333;
        }
        select[multiple] option:checked {
          background-color: #1DB954;
          color: white;
        }
        .genres-hint {
          display: block;
          margin-top: 5px;
          font-size: 0.8em;
          color: #777;
        }
      </style>
    </head>
    <body>
      <div class="generator-container">
        <header>
          <h1>Generate Spotify Playlist</h1>
          <div class="nav-links">
            <a href="/" class="home-link">Home</a>
            <a href="/recently-played?access_token=${access_token}" class="nav-link">Recently Played</a>
            <a href="/top-tracks?access_token=${access_token}" class="nav-link">Top Tracks</a>
            <a href="/top-artists?access_token=${access_token}" class="nav-link">Top Artists</a>
            <a href="/top-albums?access_token=${access_token}" class="nav-link">Top Albums</a>
          </div>
        </header>
        
        <div class="generator-form-container">
          <form action="/create-playlist" method="post" class="generator-form">
            <input type="hidden" name="access_token" value="${access_token}">
            
            <div class="form-group">
              <label for="playlist-name">Playlist Name:</label>
              <input type="text" id="playlist-name" name="playlist_name" required placeholder="My Custom Playlist" value="Find That Song - ${new Date().toLocaleDateString()}">
            </div>
            
            <div class="form-group">
              <label for="playlist-description">Description:</label>
              <textarea id="playlist-description" name="playlist_description" placeholder="Playlist generated based on my music taste">Playlist automatically generated based on my music preferences</textarea>
            </div>
            
            <div class="form-group">
              <label for="seed-type">Generate based on:</label>
              <select id="seed-type" name="seed_type" required>
                <option value="top_tracks">My Top Tracks</option>
                <option value="top_artists">My Top Artists</option>
                <option value="genres">Specific Genres</option>
              </select>
            </div>
            
            <div class="form-group" id="genres-container" style="display:none;">
              <label for="genres">Select Genres:</label>
              <select id="genres" name="genres" multiple class="form-select">
                <option value="acoustic">Acoustic</option>
                <option value="alternative">Alternative</option>
                <option value="ambient">Ambient</option>
                <option value="blues">Blues</option>
                <option value="classical">Classical</option>
                <option value="country">Country</option>
                <option value="dance">Dance</option>
                <option value="electronic">Electronic</option>
                <option value="folk">Folk</option>
                <option value="funk">Funk</option>
                <option value="hip-hop">Hip-Hop</option>
                <option value="house">House</option>
                <option value="indie">Indie</option>
                <option value="jazz">Jazz</option>
                <option value="metal">Metal</option>
                <option value="pop">Pop</option>
                <option value="r-n-b">R&B</option>
                <option value="rock">Rock</option>
                <option value="soul">Soul</option>
                <option value="techno">Techno</option>
              </select>
              <span class="genres-hint">Hold Ctrl/Cmd to select multiple genres (max 5)</span>
            </div>
            
            <div class="form-group">
              <label for="time-range">Based on time period:</label>
              <select id="time-range" name="time_range">
                <option value="short_term">Last 4 Weeks</option>
                <option value="medium_term" selected>Last 6 Months</option>
                <option value="long_term">All Time</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="track-count">Number of songs:</label>
              <input type="number" id="track-count" name="track_count" min="10" max="50" value="20">
            </div>
            
            <div class="form-group">
              <label for="playlist-public">Playlist privacy:</label>
              <select id="playlist-public" name="public">
                <option value="true">Public</option>
                <option value="false">Private</option>
              </select>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="submit-btn">Generate Playlist</button>
            </div>
          </form>
        </div>
      </div>
      
      <script>
        document.getElementById('seed-type').addEventListener('change', function() {
          const genreContainer = document.getElementById('genres-container');
          if (this.value === 'genres') {
            genreContainer.style.display = 'block';
          } else {
            genreContainer.style.display = 'none';
          }
        });
      </script>
    </body>
  </html>
  `;

  res.send(html);
});

// Add express middleware to parse POST body data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create Playlist endpoint
app.post('/create-playlist', async (req, res) => {
  try {
    const {
      access_token,
      playlist_name,
      playlist_description,
      seed_type,
      genres,
      time_range,
      track_count,
      public: isPublic // Rename 'public' to 'isPublic'
    } = req.body;

    console.log("Starting playlist creation process with:", {
      name: playlist_name,
      type: seed_type,
      track_count
    });

    // Get user ID from Spotify
    let userId;
    try {
      const userResponse = await axios.get('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': 'Bearer ' + access_token }
      });
      userId = userResponse.data.id;
      console.log("Successfully retrieved user ID:", userId);
    } catch (error) {
      console.error("Failed to get user profile:", error.response?.status, error.response?.data || error.message);
      throw new Error(`Failed to get user profile: ${error.message}`);
    }

    // Get seed data based on selection
    let seedTracks = [];
    let seedArtists = [];
    let seedGenres = [];

    // Get recommendations seeds based on selection type
    try {
      if (seed_type === 'top_tracks') {
        const tracksResponse = await axios.get(
          `https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=10`, // Get more tracks as backup
          { headers: { 'Authorization': 'Bearer ' + access_token } }
        );

        if (tracksResponse.data.items.length === 0) {
          throw new Error('No top tracks found to use as seeds');
        }

        // Take only the first 5 valid tracks
        seedTracks = tracksResponse.data.items
          .filter(item => item && item.id) // Filter out any null or undefined items
          .slice(0, 5)
          .map(item => item.id);

        console.log("Seed tracks:", seedTracks);

        // Verify we have at least one seed
        if (seedTracks.length === 0) {
          throw new Error('Could not get valid seed tracks');
        }
      }
      else if (seed_type === 'top_artists') {
        const artistsResponse = await axios.get(
          `https://api.spotify.com/v1/me/top/artists?time_range=${time_range}&limit=5`,
          { headers: { 'Authorization': 'Bearer ' + access_token } }
        );
        seedArtists = artistsResponse.data.items.map(item => item.id);
        console.log("Seed artists:", seedArtists);
      }
      else if (seed_type === 'genres') {
        if (!Array.isArray(genres)) {
          seedGenres = [genres];
        } else {
          seedGenres = genres.slice(0, 5);
        }
        console.log("Seed genres:", seedGenres);
      }
    } catch (error) {
      console.error("Failed to get seed data:", error.response?.status, error.response?.data || error.message);
      throw new Error(`Failed to get seed data: ${error.message}`);
    }

    // Build recommendations query parameters with proper formatting
    let recommendationsUrl = 'https://api.spotify.com/v1/recommendations?';
    const params = new URLSearchParams();
    params.append('limit', track_count);

    // Properly format seed parameters according to Spotify API requirements
    if (seedTracks.length > 0) {
      params.append('seed_tracks', seedTracks.join(','));
    }

    if (seedArtists.length > 0) {
      params.append('seed_artists', seedArtists.join(','));
    }

    if (seedGenres.length > 0) {
      params.append('seed_genres', seedGenres.join(','));
    }

    recommendationsUrl += params.toString();
    console.log("Recommendations URL:", recommendationsUrl);

    // Get recommendations from Spotify
    let tracks;
    try {
      const recommendationsResponse = await axios({
        method: 'get',
        url: recommendationsUrl,
        headers: {
          'Authorization': 'Bearer ' + access_token,
          'Content-Type': 'application/json'
        }
      });

      if (!recommendationsResponse.data || !recommendationsResponse.data.tracks) {
        console.error("Invalid recommendations response:", recommendationsResponse.data);
        throw new Error('Invalid response from recommendations API');
      }

      tracks = recommendationsResponse.data.tracks;
      console.log(`Retrieved ${tracks.length} recommended tracks`);

      if (tracks.length === 0) {
        throw new Error('No recommendations returned from Spotify');
      }
    } catch (error) {
      console.error("Failed to get recommendations:",
        error.response?.status,
        error.response?.data || error.message);

      // Try alternative approach - get tracks from top tracks if recommendations fail
      if (seed_type === 'top_tracks') {
        console.log("Trying fallback: using top tracks directly instead of recommendations");
        try {
          const topTracksResponse = await axios.get(
            `https://api.spotify.com/v1/me/top/tracks?time_range=${time_range}&limit=${track_count}`,
            { headers: { 'Authorization': 'Bearer ' + access_token } }
          );

          tracks = topTracksResponse.data.items;
          console.log(`Using ${tracks.length} top tracks as fallback`);

          if (tracks.length === 0) {
            throw new Error('No tracks available in fallback');
          }
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError.message);
          throw new Error(`Failed to get recommendations and fallback failed: ${error.message}`);
        }
      } else {
        throw new Error(`Failed to get recommendations: ${error.message}`);
      }
    }

    // Create playlist
    let playlistId, playlistData;
    try {
      console.log("Creating playlist with name:", playlist_name);
      const playlistResponse = await axios.post(
        'https://api.spotify.com/v1/me/playlists',
        {
          name: playlist_name,
          description: playlist_description,
          public: isPublic === 'true'
        },
        {
          headers: {
            'Authorization': 'Bearer ' + access_token,
            'Content-Type': 'application/json'
          }
        }
      );
      playlistId = playlistResponse.data.id;
      playlistData = playlistResponse.data;
      console.log("Successfully created playlist with ID:", playlistId);
    } catch (error) {
      console.error("Failed to create playlist:", error.response?.status, error.response?.data || error.message);

      // Log full request details for debugging
      console.log("Playlist creation request details:", {
        url: 'https://api.spotify.com/v1/me/playlists',
        headers: {
          'Authorization': 'Bearer [REDACTED]',
          'Content-Type': 'application/json'
        },
        body: {
          name: playlist_name,
          description: playlist_description,
          public: isPublic === 'true'
        }
      });

      throw new Error(`Failed to create playlist: ${error.response?.data?.error?.message || error.message}`);
    }

    // Add tracks to playlist
    try {
      const trackUris = tracks.map(track => track.uri);
      console.log(`Adding ${trackUris.length} tracks to playlist ${playlistId}`);

      await axios.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        { uris: trackUris },
        {
          headers: {
            'Authorization': 'Bearer ' + access_token,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log("Successfully added tracks to playlist");
    } catch (error) {
      console.error("Failed to add tracks to playlist:", error.response?.status, error.response?.data || error.message);
      throw new Error(`Failed to add tracks to playlist: ${error.message}`);
    }

    // Render success page with playlist details
    let html = `
    <html>
      <head>
        <title>Playlist Created</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="/css/playlist-generator.css">
      </head>
      <body>
        <div class="generator-container">
          <header>
            <h1>Playlist Created Successfully!</h1>
            <div class="nav-links">
              <a href="/" class="home-link">Home</a>
              <a href="/generate-playlist?access_token=${access_token}" class="nav-link">Create Another</a>
            </div>
          </header>
          
          <div class="playlist-success">
            <h2>"${playlist_name}" is ready to play!</h2>
            <p>${tracks.length} tracks have been added to your playlist.</p>
            
            <div class="playlist-actions">
              <a href="${playlistData.external_urls.spotify}" target="_blank" class="spotify-link">Open in Spotify</a>
              <a href="/generate-playlist?access_token=${access_token}" class="create-another">Create Another Playlist</a>
            </div>
          </div>
          
          <div class="tracks-list">
            <h3>Tracks in Your Playlist:</h3>
    `;

    tracks.forEach((track, index) => {
      const album = track.album;

      html += `
        <div class="track-item">
          <div class="track-rank">${index + 1}</div>
          <a href="${track.external_urls.spotify}" target="_blank" title="Play ${track.name} on Spotify">
            <img src="${album.images[2]?.url || album.images[0].url}" alt="${album.name}" class="album-img" />
          </a>
          <div class="track-info">
            <div class="track-name">${track.name}</div>
            <div class="artist-name">
              ${track.artists.map(artist =>
        `<a href="${artist.external_urls.spotify}" target="_blank" class="artist-link">${artist.name}</a>`
      ).join(', ')}
            </div>
            <div class="album-name">
              <a href="${album.external_urls.spotify}" target="_blank" class="album-link">${album.name}</a>
            </div>
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </body>
    </html>
    `;

    res.send(html);

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

    res.send(`
      <html>
        <head>
          <title>Error</title>
          <link rel="stylesheet" href="/css/error.css">
        </head>
        <body>
          <div class="error-container">
            <h1>Error Creating Playlist</h1>
            <p>Something went wrong when creating your playlist.</p>
            <p>Error details: ${error.response?.data?.error?.message || error.message}</p>
            <pre>${error.response?.data?.error?.status || ''} - Step: ${error.step || 'unknown'}</pre>
            <a href="/generate-playlist?access_token=${req.body.access_token}" class="home-link">Try Again</a>
          </div>
        </body>
      </html>
    `);
  }
});

// Handling uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Graceful shutdown
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Do not exit the process, just log the error
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