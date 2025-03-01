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
        </div>
      </body>
    </html>
  `);
});

app.get('/login', (req, res) => {
  const scope = 'user-read-recently-played';
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
            <a href="/" class="home-link">Home</a>
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

// Modifica la parte finale per supportare sia l'ambiente di sviluppo locale sia Vercel

// Per l'ambiente Vercel serverless
module.exports = app;

// Solo per l'ambiente di sviluppo locale, non eseguire in Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
  });
}