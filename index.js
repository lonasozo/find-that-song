const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

const app = express();
const port = 3000;

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

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
    res.send(response.data);
  }).catch(error => {
    res.send(error);
  });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});