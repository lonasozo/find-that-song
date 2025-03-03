const express = require('express');
const router = express.Router();
const spotifyService = require('../services/spotify');

// Modifichiamo la route dei Top Tracks per restituire HTML quando ajax=true
router.get('/top-tracks', async (req, res) => {
  try {
    const accessToken = req.query.access_token || req.session.access_token;
    const timeRange = req.query.time_range || 'short_term';
    const isAjax = req.xhr || req.query.ajax === 'true';

    if (!accessToken) {
      return res.redirect('/login');
    }

    console.log(`Fetching top tracks with time_range: ${timeRange}`);
    const tracks = await spotifyService.getTopTracks(accessToken, timeRange, 50);
    console.log(`Retrieved ${tracks.length} top tracks`);

    if (isAjax) {
      // Per AJAX, renderizziamo il view parziale senza layout
      return res.render('top-tracks', {
        tracks: tracks,
        layout: false
      });
    } else {
      // Renderizzazione pagina normale con layout completo
      return res.render('top-tracks', {
        title: 'Top Tracks',
        tracks: tracks,
        access_token: accessToken
      });
    }
  } catch (error) {
    console.error('Error getting top tracks:', error);

    if (req.xhr || req.query.ajax === 'true') {
      return res.status(500).send('<div class="error-message">Failed to load tracks. Please try again.</div>');
    } else {
      return res.render('error', {
        message: 'Failed to load top tracks',
        error
      });
    }
  }
});

// Top Artists route con supporto per time_range
router.get('/top-artists', async (req, res) => {
  try {
    const accessToken = req.query.access_token || req.session.access_token;
    const timeRange = req.query.time_range || 'short_term';
    const isAjax = req.xhr || req.query.ajax === 'true';

    if (!accessToken) {
      return res.redirect('/login');
    }

    console.log(`Fetching top artists with time_range: ${timeRange}`);
    const artists = await spotifyService.getTopArtists(accessToken, timeRange, 50);
    console.log(`Retrieved ${artists.length} top artists`);

    if (isAjax) {
      return res.json({ artists });
    } else {
      return res.render('top-artists', {
        title: 'Top Artists',
        artists,
        access_token: accessToken
      });
    }
  } catch (error) {
    console.error('Error getting top artists:', error);

    if (req.xhr || req.query.ajax === 'true') {
      return res.status(500).json({ error: 'Failed to load top artists' });
    } else {
      return res.render('error', {
        message: 'Failed to load top artists',
        error
      });
    }
  }
});

// ...existing routes...

module.exports = router;
