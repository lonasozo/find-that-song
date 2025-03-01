const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

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
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #121212;
            color: white;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          h1 {
            font-size: 2.5rem;
            margin-bottom: 2rem;
          }
          .login-button {
            background-color: #1DB954;
            color: white;
            border: none;
            border-radius: 30px;
            padding: 16px 32px;
            font-size: 1.2rem;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.3s;
            text-decoration: none;
            text-transform: uppercase;
          }
          .login-button:hover {
            background-color: #1ed760;
          }
          .description {
            margin-top: 2rem;
            text-align: center;
            max-width: 600px;
            line-height: 1.6;
          }
        </style>
      </head>
      <body>
        <h1>Find That Song</h1>
        <a href="/login" class="login-button">LOGIN with Spotify</a>
        <div class="description">
          <p>Trova facilmente le canzoni che hai ascoltato di recente su Spotify, ma di cui non ti ricordi il nome o che non hai fatto in tempo a salvare.</p>
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
    res.redirect('/songs?access_token=' + access_token);
  }).catch(error => {
    res.send(error);
  });
});

app.get('/songs', (req, res) => {
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
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body {
            font-family: 'Circular', Helvetica, Arial, sans-serif;
            background-color: #121212;
            color: #ffffff;
            padding: 20px;
          }
          
          header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 1px solid #282828;
          }
          
          h1 {
            font-size: 2rem;
            font-weight: 700;
          }
          
          .home-link {
            background-color: #333;
            color: white;
            border: none;
            border-radius: 20px;
            padding: 8px 16px;
            text-decoration: none;
            font-size: 0.9rem;
          }
          
          .tracks-container {
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .track-item {
            display: grid;
            grid-template-columns: 60px 1fr auto;
            gap: 16px;
            padding: 12px;
            margin-bottom: 8px;
            border-radius: 4px;
            transition: background-color 0.2s;
            align-items: center;
          }
          
          .track-item:hover {
            background-color: #282828;
          }
          
          .album-img {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 4px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          }
          
          .track-info {
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          
          .track-name {
            font-weight: 700;
            margin-bottom: 4px;
            color: #fff;
          }
          
          .artist-name {
            font-size: 0.9rem;
            color: #b3b3b3;
            margin-bottom: 4px;
          }
          
          .album-name {
            font-size: 0.8rem;
            color: #b3b3b3;
          }
          
          .track-meta {
            text-align: right;
            color: #b3b3b3;
            font-size: 0.8rem;
          }
          
          .spotify-link {
            display: inline-block;
            background-color: #1DB954;
            color: white;
            border-radius: 20px;
            padding: 8px 16px;
            text-decoration: none;
            margin-top: 8px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            transition: background-color 0.3s;
          }
          
          .spotify-link:hover {
            background-color: #1ed760;
          }
          
          @media (max-width: 768px) {
            .track-item {
              grid-template-columns: 50px 1fr;
            }
            
            .album-img {
              width: 50px;
              height: 50px;
            }
            
            .track-meta {
              grid-column: 1 / -1;
              text-align: left;
              margin-top: 8px;
            }
          }
        </style>
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
          <img src="${album.images[2]?.url || album.images[0].url}" alt="${album.name}" class="album-img" />
          <div class="track-info">
            <div class="track-name">${track.name}</div>
            <div class="artist-name">${track.artists.map(artist => artist.name).join(', ')}</div>
            <div class="album-name">${album.name}</div>
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
          <style>
            body {
              font-family: 'Circular', Helvetica, Arial, sans-serif;
              background-color: #121212;
              color: #ffffff;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              padding: 20px;
              text-align: center;
            }
            
            h1 {
              color: #ff5555;
            }
            
            .error-container {
              background-color: #282828;
              padding: 20px;
              border-radius: 8px;
              max-width: 600px;
            }
            
            .home-link {
              display: inline-block;
              background-color: #1DB954;
              color: white;
              border-radius: 20px;
              padding: 12px 24px;
              text-decoration: none;
              margin-top: 20px;
              font-weight: bold;
              text-transform: uppercase;
            }
          </style>
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