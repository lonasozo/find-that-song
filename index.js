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
  const scope = 'user-read-recently-played user-top-read';
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

// Modifica la parte finale per supportare sia l'ambiente di sviluppo locale sia Vercel

// Per l'ambiente Vercel serverless
module.exports = app;

// Solo per l'ambiente di sviluppo locale, non eseguire in Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
  });
}