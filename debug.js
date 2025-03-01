require('dotenv').config();
const axios = require('axios');

console.log('Starting Spotify API debug test...');
console.log('Checking environment variables:');
console.log('- SPOTIFY_CLIENT_ID:', process.env.SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('- SPOTIFY_CLIENT_SECRET:', process.env.SPOTIFY_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('- SPOTIFY_REDIRECT_URI:', process.env.SPOTIFY_REDIRECT_URI);

// Test basic auth to check credentials
axios({
  method: 'post',
  url: 'https://accounts.spotify.com/api/token',
  params: {
    grant_type: 'client_credentials'
  },
  headers: {
    'Authorization': 'Basic ' + (new Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')),
    'Content-Type': 'application/x-www-form-urlencoded'
  }
})
  .then(response => {
    console.log('✅ Successfully connected to Spotify API');
    console.log('Access token obtained successfully');
  })
  .catch(error => {
    console.log('❌ Error connecting to Spotify API:');
    console.error(error.response ? error.response.data : error.message);
  });
