const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const port = 3000;

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

app.get('/', (req, res) => {
  res.send('Server is running');
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
    let html = '<html><head><title>Recently Played Songs</title></head><body>';
    html += '<h1>Recently Played Songs</h1><ul>';
    
    items.forEach(item => {
      const track = item.track;
      const album = track.album;
      html += `<li>
        <img src="${album.images[1].url}" alt="${album.name}" style="width:100px;height:100px;"/>
        <p><strong>Track:</strong> ${track.name}</p>
        <p><strong>Album:</strong> ${album.name}</p>
        <p><strong>Artist:</strong> ${track.artists.map(artist => artist.name).join(', ')}</p>
        <p><strong>Played at:</strong> ${new Date(item.played_at).toLocaleString()}</p>
        <p><a href="${track.external_urls.spotify}">Listen on Spotify</a></p>
      </li>`;
    });
    
    html += '</ul></body></html>';
    res.send(html);
  }).catch(error => {
    res.send(error);
  });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});