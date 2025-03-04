const axios = require('axios');
const querystring = require('querystring');

// Assicuriamoci che dotenv sia caricato anche qui
const path = require('path');

// Carica dotenv solo in sviluppo, in produzione usa le variabili d'ambiente configurate
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
  console.log('Ambiente di sviluppo: caricamento variabili da .env.local');
} else {
  console.log('Ambiente di produzione: utilizzo variabili d\'ambiente preconfigurate');
}

// Verifico se le variabili sono disponibili o usa valori di fallback
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || process.env.NEXT_PUBLIC_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'https://find-that-song.vercel.app/callback';

class SpotifyService {
  constructor() {
    this.client_id = CLIENT_ID;
    this.client_secret = CLIENT_SECRET;
    this.redirect_uri = REDIRECT_URI;

    // Log della configurazione per debug
    console.log('SpotifyService inizializzato con:');
    console.log(`- CLIENT_ID: ${this.client_id ? this.client_id.substring(0, 5) + '...' : 'MANCANTE'}`);
    console.log(`- CLIENT_SECRET: ${this.client_secret ? 'PRESENTE' : 'MANCANTE'}`);
    console.log(`- REDIRECT_URI: ${this.redirect_uri}`);

    if (!this.client_id || this.client_id.trim() === '') {
      console.warn('ATTENZIONE: CLIENT_ID mancante! Verificare le variabili d\'ambiente su Vercel.');
    }

    if (!this.client_secret || this.client_secret.trim() === '') {
      console.warn('ATTENZIONE: CLIENT_SECRET mancante! Verificare le variabili d\'ambiente su Vercel.');
    }

    if (!this.redirect_uri || this.redirect_uri.trim() === '') {
      console.warn('ATTENZIONE: REDIRECT_URI è vuoto! Utilizzo fallback.');
      this.redirect_uri = 'https://find-that-song.vercel.app/callback';
    }
  }

  /**
   * Ottieni URL di autorizzazione per login Spotify
   * @param {string} scope - Permessi Spotify richiesti
   * @returns {string} - URL di autorizzazione
   */
  getAuthorizationUrl(scope) {
    console.log('Generazione URL di autorizzazione Spotify con:');
    console.log(`- CLIENT_ID: ${this.client_id ? this.client_id.substring(0, 5) + '...' : 'MANCANTE'}`);
    console.log(`- REDIRECT_URI: ${this.redirect_uri || 'MANCANTE'}`);

    if (!this.client_id || this.client_id.trim() === '') {
      throw new Error(
        'CLIENT_ID non configurato nelle variabili d\'ambiente. ' +
        'Assicurarsi di configurare CLIENT_ID e CLIENT_SECRET nel pannello di controllo di Vercel ' +
        'o nel file .env.local per l\'ambiente di sviluppo.'
      );
    }

    const params = new URLSearchParams({
      client_id: this.client_id,
      response_type: 'code',
      redirect_uri: this.redirect_uri,
      scope: scope || '',
      show_dialog: true
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  /**
   * Scambia codice di autorizzazione per token di accesso
   * @param {string} code - Codice di autorizzazione da Spotify
   * @returns {Promise<Object>} - Risposta token con access_token
   */
  async getAccessToken(code) {
    try {
      console.log('Ottenimento access token con:');
      console.log(`- CLIENT_ID: ${this.client_id ? 'OK' : 'MANCANTE'}`);
      console.log(`- CLIENT_SECRET: ${this.client_secret ? 'OK' : 'MANCANTE'}`);
      console.log(`- REDIRECT_URI: ${this.redirect_uri || 'MANCANTE'}`);

      const response = await axios.post('https://accounts.spotify.com/api/token',
        querystring.stringify({
          code: code,
          redirect_uri: this.redirect_uri,
          grant_type: 'authorization_code'
        }),
        {
          headers: {
            'Authorization': 'Basic ' + (Buffer.from(this.client_id + ':' + this.client_secret).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('Errore durante l\'ottenimento dell\'access token:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Ottieni brani ascoltati di recente dall'utente
   * @param {string} accessToken - Token di accesso Spotify
   * @param {number} limit - Numero di brani da restituire
   * @returns {Promise<Array>} - Brani ascoltati di recente
   */
  async getRecentlyPlayed(accessToken, limit = 50) {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
        headers: { 'Authorization': 'Bearer ' + accessToken },
        params: { limit: limit }
      });

      return response.data.items;
    } catch (error) {
      console.error('Errore durante l\'ottenimento dei brani ascoltati di recente:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Ottieni i brani più ascoltati dall'utente
   * @param {string} accessToken - Token di accesso Spotify
   * @param {string} timeRange - Intervallo di tempo (short_term, medium_term, long_term)
   * @param {number} limit - Numero di brani da restituire
   * @returns {Promise<Array>} - Brani più ascoltati
   */
  async getTopTracks(accessToken, timeRange = 'medium_term', limit = 50) {
    try {
      const response = await axios.get(`https://api.spotify.com/v1/me/top/tracks`, {
        params: { time_range: timeRange, limit },
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });

      return response.data.items;
    } catch (error) {
      console.error('Errore durante l\'ottenimento dei brani più ascoltati:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Ottieni gli artisti più ascoltati dall'utente
   * @param {string} accessToken - Token di accesso Spotify
   * @param {string} timeRange - Intervallo di tempo (short_term, medium_term, long_term)
   * @param {number} limit - Numero di artisti da restituire
   * @returns {Promise<Array>} - Artisti più ascoltati
   */
  async getTopArtists(accessToken, timeRange = 'medium_term', limit = 50) {
    try {
      const response = await axios.get(`https://api.spotify.com/v1/me/top/artists`, {
        params: { time_range: timeRange, limit },
        headers: { 'Authorization': 'Bearer ' + accessToken }
      });

      return response.data.items;
    } catch (error) {
      console.error('Errore durante l\'ottenimento degli artisti più ascoltati:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Ottieni informazioni profilo utente
   * @param {string} accessToken - Token di accesso Spotify
   * @returns {Promise<Object>} - Dati profilo utente
   */
  async getUserProfile(accessToken) {
    try {
      console.log('Ottenimento profilo utente');

      const response = await axios.get('https://api.spotify.com/v1/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      console.log(`Ottenuto profilo per l'utente: ${response.data.display_name} (${response.data.id})`);
      return response.data;
    } catch (error) {
      console.error('Errore durante l\'ottenimento del profilo utente:', error);
      if (error.response) {
        console.error('Stato risposta:', error.response.status);
        console.error('Dati risposta:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Ottieni generi disponibili da Spotify
   * @returns {Promise<string[]>} Array di generi disponibili
   */
  async getAvailableGenreSeeds() {
    try {
      console.log('Recupero generi disponibili da Spotify...');

      // Lista hardcoded di generi comuni Spotify come fallback
      const commonGenres = [
        'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'blues',
        'classical', 'country', 'dance', 'electronic', 'folk', 'funk',
        'hip-hop', 'house', 'indie', 'jazz', 'metal', 'pop', 'punk', 'r-n-b',
        'reggae', 'rock', 'soul'
      ];

      try {
        const response = await axios({
          method: 'get',
          url: 'https://api.spotify.com/v1/recommendations/available-genre-seeds',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        });

        if (response.data && response.data.genres && response.data.genres.length > 0) {
          console.log(`Recuperati ${response.data.genres.length} generi disponibili dall'API`);
          return response.data.genres;
        } else {
          console.log('API ha restituito una lista di generi vuota, utilizzo generi comuni');
          return commonGenres;
        }
      } catch (error) {
        console.error('Errore nel recupero dei generi dall\'API, utilizzo generi comuni:', error.message);
        return commonGenres;
      }
    } catch (error) {
      console.error('Errore in getAvailableGenreSeeds:', error.message);
    }

    // Restituisci una lista sicura di generi comuni
    return ['pop', 'rock', 'hip-hop', 'electronic', 'indie', 'jazz', 'alternative'];
  }

  /**
   * Shuffle di un array (algoritmo Fisher-Yates)
   * @param {Array} array - Array da shufflare
   * @returns {Array} - Array shufflato
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Ottieni raccomandazioni musicali basate su seed
   * @param {string} accessToken - Token di accesso Spotify
   * @param {Object} options - Opzioni per le raccomandazioni
   * @returns {Promise<Array>} - Brani raccomandati
   */
  async getRecommendations(accessToken, options = {}) {
    try {
      const {
        seedTracks = [],
        seedArtists = [],
        seedGenres = [],
        limit = 20
      } = options;

      console.log(`Ottenimento raccomandazioni con limite: ${limit}`);

      // Se sono selezionati più generi, prova due approcci:
      // 1. Prima prova con tutti i generi come seed (fino a 5)
      // 2. Se fallisce, ottieni raccomandazioni per ogni genere separatamente e combina
      if (seedGenres && seedGenres.length > 1) {
        console.log(`Più generi selezionati: ${seedGenres.join(', ')}`);

        // Prova approccio 1: Tutti i generi insieme (limitato a 5)
        try {
          const combinedTracks = await this.getRecommendationsWithAllGenres(
            accessToken,
            seedGenres.slice(0, 5),
            limit
          );

          if (combinedTracks && combinedTracks.length > 0) {
            console.log(`Ottenute con successo ${combinedTracks.length} tracce usando generi combinati`);
            return combinedTracks;
          }
        } catch (combinedError) {
          console.log('Approccio generi combinati fallito, provo generi individuali');
        }

        // Prova approccio 2: Genere per genere
        try {
          const mixedTracks = await this.getRecommendationsByGenreMix(
            accessToken,
            seedGenres,
            limit
          );

          if (mixedTracks && mixedTracks.length > 0) {
            console.log(`Ottenute con successo ${mixedTracks.length} tracce usando approccio mix di generi`);
            return mixedTracks;
          }
        } catch (mixError) {
          console.log('Approccio mix di generi fallito, ricorso alla ricerca');
        }

        // Se entrambi gli approcci di raccomandazione falliscono, usa API di ricerca
        console.log('Provo ricerca diretta per più generi...');
        return await this.searchTracksByGenre(accessToken, seedGenres, limit);
      }

      // Caso singolo genere o nessun genere - usa implementazione originale
      // Primo tentativo - usa il formato seed corretto e formato URL standard
      try {
        const params = new URLSearchParams();
        params.append('limit', limit);

        // Aggiungi parametri seed correttamente
        if (seedTracks.length > 0) {
          params.append('seed_tracks', seedTracks.slice(0, 5).join(','));
          console.log(`Utilizzo seed tracks: ${params.get('seed_tracks')}`);
        }

        if (seedArtists.length > 0) {
          params.append('seed_artists', seedArtists.slice(0, 5).join(','));
          console.log(`Utilizzo seed artists: ${params.get('seed_artists')}`);
        }

        // Elabora generi e assicura che siano in formato valido
        if (seedGenres.length > 0) {
          // Pulizia nomi genere - rimuovi spazi, minuscolo, assicura che siano validi
          const validGenres = seedGenres
            .filter(Boolean) // Filtra valori undefined/null/vuoti
            .slice(0, 5)
            .map(genre => genre.toLowerCase().trim().replace(/\s+/g, '-'));

          if (validGenres.length > 0) {
            // Usa generi comuni solo se disponibili
            const safeGenres = this.getSafeGenres(validGenres);
            params.append('seed_genres', safeGenres.join(','));
            console.log(`Utilizzo seed genres: ${params.get('seed_genres')}`);
          }
        }

        // Aggiungi parametri feature audio per varietà
        if (seedGenres.includes('country')) {
          params.append('target_acousticness', '0.7');
        } else if (seedGenres.includes('pop')) {
          params.append('target_popularity', '70');
        } else if (seedGenres.includes('rock')) {
          params.append('target_energy', '0.8');
        }

        console.log('Effettuo richiesta raccomandazioni con params:', params.toString());

        const response = await axios.get(
          'https://api.spotify.com/v1/recommendations', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          params: params
        }
        );

        console.log(`Ricevute ${response.data.tracks?.length || 0} raccomandazioni`);

        // Log di debug per vedere che tipo di tracce stiamo ricevendo
        if (response.data.tracks && response.data.tracks.length > 0) {
          const firstThreeTracks = response.data.tracks.slice(0, 3);
          console.log('Tracce di esempio ricevute:',
            firstThreeTracks.map(t => `"${t.name}" by ${t.artists[0].name}`).join(', '));

          return response.data.tracks;
        } else {
          throw new Error('Nessuna traccia restituita dall\'API di raccomandazione');
        }
      } catch (recommendationsError) {
        console.error('Errore in API di raccomandazione:', recommendationsError.message);
        // Continua al metodo di backup
      }

      // Secondo approccio - prova la ricerca come fallback invece delle raccomandazioni
      console.log('Provo ricerca diretta di tracce per genere...');
      return await this.searchTracksByGenre(accessToken, seedGenres[0] || 'country', limit);
    } catch (error) {
      console.error('Tutti i metodi di raccomandazione falliti:', error);
      // Prova tracce fallback come ultima risorsa
      return await this.getFallbackTracks(accessToken, limit);
    }
  }

  /**
   * Ottieni raccomandazioni usando tutti i generi come seed
   * @param {string} accessToken - Token di accesso Spotify
   * @param {Array<string>} genres - Array di generi da usare come seed
   * @param {number} limit - Numero di tracce da restituire
   * @returns {Promise<Array>} - Array di tracce raccomandate
   */
  async getRecommendationsWithAllGenres(accessToken, genres, limit) {
    try {
      // Pulisci e valida i generi
      const validGenres = genres
        .filter(Boolean)
        .slice(0, 5) // Spotify permette massimo 5 seed totali
        .map(genre => genre.toLowerCase().trim().replace(/\s+/g, '-'));

      if (validGenres.length === 0) {
        return [];
      }

      const safeGenres = this.getSafeGenres(validGenres);

      // Crea parametri con tutti i generi in una volta
      const params = new URLSearchParams();
      params.append('limit', limit);
      params.append('seed_genres', safeGenres.join(','));

      // Aggiungi timestamp per evitare risultati in cache
      params.append('timestamp', Date.now());

      console.log(`Ottenimento raccomandazioni con tutti i generi: ${safeGenres.join(',')}`);

      const response = await axios.get('https://api.spotify.com/v1/recommendations', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: params
      });

      if (response.data?.tracks?.length > 0) {
        return response.data.tracks;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Errore nell\'ottenimento raccomandazioni con tutti i generi:', error.message);
      return [];
    }
  }

  /**
   * Ottieni raccomandazioni per ogni genere e mixale insieme
   * @param {string} accessToken - Token di accesso Spotify
   * @param {Array<string>} genres - Array di generi
   * @param {number} limit - Numero totale di tracce da restituire
   * @returns {Promise<Array>} - Array mixato di tracce
   */
  async getRecommendationsByGenreMix(accessToken, genres, limit) {
    try {
      // Calcola tracce per genere
      const validGenres = genres.filter(Boolean);
      if (validGenres.length === 0) return [];

      const tracksPerGenre = Math.ceil(limit / validGenres.length);
      let allTracks = [];

      // Ottieni raccomandazioni per ogni genere individualmente
      for (const genre of validGenres) {
        try {
          const params = new URLSearchParams();
          params.append('seed_genres', genre);
          params.append('limit', tracksPerGenre);

          // Aggiungi timestamp per evitare risultati in cache
          params.append('timestamp', Date.now() % 1000);

          console.log(`Ottenimento raccomandazioni per genere: ${genre}`);

          const response = await axios.get('https://api.spotify.com/v1/recommendations', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            params: params
          });

          if (response.data?.tracks?.length > 0) {
            console.log(`Ottenute ${response.data.tracks.length} tracce per genere "${genre}"`);
            allTracks = allTracks.concat(response.data.tracks);
          }
        } catch (genreError) {
          console.log(`Impossibile ottenere raccomandazioni per genere "${genre}":`, genreError.message);
        }
      }

      // Controlla se abbiamo ottenuto tracce
      if (allTracks.length > 0) {
        // Shuffle e limita
        const shuffled = this.shuffleArray(allTracks);
        return shuffled.slice(0, limit);
      }

      return [];
    } catch (error) {
      console.error('Errore nelle raccomandazioni mix genere:', error.message);
      return [];
    }
  }

  /**
   * Usa Spotify search API per trovare tracce per genere
   * @param {string} accessToken - Token di accesso Spotify
   * @param {string|Array} genres - Genere(i) da cercare
   * @param {number} limit - Numero di tracce da restituire
   * @returns {Promise<Array>} - Array di tracce
   */
  async searchTracksByGenre(accessToken, genres, limit = 20) {
    try {
      // Converti singolo genere in array per coerenza
      const genreArray = Array.isArray(genres) ? genres : [genres];

      // Filtra generi vuoti
      const validGenres = genreArray.filter(g => g && g.trim() !== '');

      if (validGenres.length === 0) {
        console.log('Nessun genere valido fornito per la ricerca');
        return [];
      }

      console.log(`Ricerca tracce tra ${validGenres.length} generi: ${validGenres.join(', ')}`);

      // Calcola quante tracce recuperare per genere
      const tracksPerGenre = Math.ceil(limit / validGenres.length);
      let allTracks = [];

      // Cerca per ogni genere e raccogli risultati
      for (const genre of validGenres) {
        try {
          // Ricerca specifica genere con prefisso genre:
          const searchQuery = `genre:${genre}`;
          console.log(`Ricerca per "${searchQuery}"`);

          const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            params: {
              q: searchQuery,
              type: 'track',
              limit: tracksPerGenre
            }
          });

          if (response.data.tracks && response.data.tracks.items.length > 0) {
            console.log(`Trovate ${response.data.tracks.items.length} tracce per genere "${genre}"`);
            allTracks = allTracks.concat(response.data.tracks.items);
            continue; // Passa al genere successivo se abbiamo ottenuto risultati
          }

          // Se la ricerca specifica fallisce, prova ricerca più generica per keyword
          console.log(`Nessun risultato per "genre:${genre}", provo ricerca generale per "${genre}"`);
          const keywordResponse = await axios.get('https://api.spotify.com/v1/search', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            },
            params: {
              q: genre, // Usa semplicemente il genere come keyword
              type: 'track',
              limit: tracksPerGenre
            }
          });

          if (keywordResponse.data.tracks && keywordResponse.data.tracks.items.length > 0) {
            console.log(`Trovate ${keywordResponse.data.tracks.items.length} tracce con keyword "${genre}"`);
            allTracks = allTracks.concat(keywordResponse.data.tracks.items);
          } else {
            console.log(`Nessun risultato trovato per genere "${genre}"`);
          }
        } catch (genreError) {
          console.error(`Errore durante la ricerca per genere "${genre}": `, genreError.message);
          // Continua con altri generi
        }
      }

      // Randomizza e limita i risultati finali
      if (allTracks.length > 0) {
        console.log(`Trovato un totale di ${allTracks.length} tracce tra tutti i generi`);

        // Shuffle delle tracce per mixare generi
        const shuffledTracks = this.shuffleArray(allTracks);

        // Prendi solo fino al limite richiesto
        const limitedTracks = shuffledTracks.slice(0, limit);

        console.log(`Restituzione ${limitedTracks.length} tracce mixate tra i generi selezionati`);
        return limitedTracks;
      }

      console.log('Nessuna traccia trovata in nessun genere');
      return [];
    } catch (error) {
      console.error('Errore durante la ricerca tracce per genere:', error.message);
      return [];
    }
  }

  /**
   * Ottieni una lista di generi sicuri che dovrebbero funzionare con Spotify API
   * @param {string[]} userGenres - Generi selezionati dall'utente
   * @returns {string[]} - Lista sicura di generi
   */
  getSafeGenres(userGenres = []) {
    // Questi sono noti per essere seed di generi Spotify validi
    const validGenres = [
      'acoustic', 'afrobeat', 'alt-rock', 'alternative', 'ambient', 'anime',
      'black-metal', 'bluegrass', 'blues', 'bossanova', 'brazil', 'breakbeat',
      'british', 'cantopop', 'chicago-house', 'children', 'chill', 'classical',
      'club', 'comedy', 'country', 'dance', 'dancehall', 'death-metal', 'deep-house',
      'detroit-techno', 'disco', 'disney', 'drum-and-bass', 'dub', 'dubstep', 'edm',
      'electro', 'electronic', 'emo', 'folk', 'forro', 'french', 'funk', 'garage',
      'german', 'gospel', 'goth', 'grindcore', 'groove', 'grunge', 'guitar',
      'happy', 'hard-rock', 'hardcore', 'hardstyle', 'heavy-metal', 'hip-hop',
      'house', 'idm', 'indian', 'indie', 'indie-pop', 'industrial', 'iranian',
      'j-dance', 'j-idol', 'j-pop', 'j-rock', 'jazz', 'k-pop', 'kids', 'latin',
      'latino', 'malay', 'mandopop', 'metal', 'metal-misc', 'metalcore', 'minimal-techno',
      'mpb', 'new-age', 'new-release', 'opera', 'pagode', 'party', 'piano',
      'pop', 'pop-film', 'post-dubstep', 'power-pop', 'progressive-house', 'psych-rock',
      'punk', 'punk-rock', 'r-n-b', 'rainy-day', 'reggae', 'reggaeton', 'road-trip',
      'rock', 'rock-n-roll', 'rockabilly', 'romance', 'sad', 'salsa', 'samba',
      'sertanejo', 'show-tunes', 'singer-songwriter', 'ska', 'sleep', 'songwriter',
      'soul', 'soundtracks', 'spanish', 'study', 'summer', 'swedish', 'synth-pop',
      'tango', 'techno', 'trance', 'trip-hop', 'turkish', 'work-out', 'world-music'
    ];

    // Se nessun genere utente, restituisce alcuni popolari
    if (!userGenres || userGenres.length === 0) {
      return ['pop', 'rock', 'hip-hop'];
    }

    // Filtra generi utente per includere solo quelli validi
    const safeGenres = userGenres.filter(genre => validGenres.includes(genre));

    // Se nessuno dei generi utente è valido, restituisce quelli popolari
    if (safeGenres.length === 0) {
      console.log('Nessun genere valido trovato, uso defaults');
      return ['pop', 'rock', 'hip-hop'];
    }

    return safeGenres;
  }

  /**
   * Valida che i seed di genere siano accettabili per Spotify
   * @param {string} accessToken - Token di accesso Spotify
   * @param {string[]} genres - Lista di generi da validare
   */
  async validateGenreSeeds(accessToken, genres) {
    try {
      const response = await axios({
        method: 'get',
        url: 'https://api.spotify.com/v1/recommendations/available-genre-seeds',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.data && response.data.genres) {
        const availableGenres = response.data.genres;
        const invalidGenres = genres.filter(g => !availableGenres.includes(g));

        if (invalidGenres.length > 0) {
          console.log(`Attenzione: Seed genere invalidi rilevati: ${invalidGenres.join(', ')}`);
        }
      }
    } catch (error) {
      console.log('Impossibile validare seed genere, continuo comunque');
    }
  }

  /**
   * Ottieni tracce fallback quando tutti i metodi di raccomandazione falliscono
   * @param {string} accessToken - Token di accesso Spotify
   * @param {number} limit - Numero di tracce da restituire
   * @returns {Promise<Array>} Array di tracce
   */
  async getFallbackTracks(accessToken, limit = 20) {
    try {
      console.log('Ottenimento tracce fallback dalle tracce top dell\'utente...');

      // Prova medium_term prima (ultimi 6 mesi)
      try {
        const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
          params: { time_range: 'medium_term', limit },
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.data?.items?.length > 0) {
          console.log(`Ottenute ${response.data.items.length} tracce fallback dalle tracce top dell'utente (medium_term)`);
          return response.data.items;
        }
      } catch (mediumTermError) {
        console.log('Fallback medium term fallito:', mediumTermError.message);
      }

      // Se medium_term fallisce, prova short_term (ultime 4 settimane)
      try {
        const response = await axios.get('https://api.spotify.com/v1/me/top/tracks', {
          params: { time_range: 'short_term', limit },
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.data?.items?.length > 0) {
          console.log(`Ottenute ${response.data.items.length} tracce fallback dalle tracce top dell'utente (short_term)`);
          return response.data.items;
        }
      } catch (shortTermError) {
        console.log('Fallback short term fallito:', shortTermError.message);
      }

      // Come ultima risorsa, prova a ottenere tracce riprodotte di recente
      try {
        const recentlyPlayed = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
          params: { limit },
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (recentlyPlayed.data?.items?.length > 0) {
          console.log(`Ottenute ${recentlyPlayed.data.items.length} tracce dalle riproduzioni recenti`);
          return recentlyPlayed.data.items.map(item => item.track);
        }
      } catch (recentlyPlayedError) {
        console.error('Fallback riproduzioni recenti fallito:', recentlyPlayedError.message);
      }

      // Se tutto fallisce, restituisci un array vuoto
      console.log('Tutti i metodi di recupero tracce falliti, restituisco array vuoto');
      return [];
    } catch (error) {
      console.error('Errore in getFallbackTracks:', error.message);
      return [];
    }
  }

  /**
   * Ottieni tracce di ultima risorsa quando tutto il resto fallisce
   * @param {number} limit - Numero di tracce da restituire
   * @returns {Promise<Object>} - Oggetto raccomandazioni con tracce
   */
  async getLastResortTracks(limit = 20) {
    try {
      console.log('Provo metodo di ultima risorsa per ottenere tracce...');

      // Prova a ottenere direttamente le tracce top dell'utente
      try {
        const topTracks = await this.getTopItems('tracks', { limit });

        if (topTracks && topTracks.items && topTracks.items.length > 0) {
          console.log('Utilizzo tracce top dell\'utente come raccomandazioni');
          return {
            tracks: topTracks.items,
            seeds: [{ id: 'top_tracks', type: 'fallback' }]
          };
        }
      } catch (topTracksError) {
        console.error('Errore durante l\'ottenimento delle tracce top:', topTracksError.message);
      }

      // Risorsa finale - crea una struttura di base con tracce vuote
      console.log('Tutti i metodi di raccomandazione falliti, restituisco lista tracce vuota');
      return { tracks: [] };
    } catch (error) {
      console.error('Errore nel metodo di ultima risorsa:', error.message);
      return { tracks: [] };
    }
  }

  /**
   * Ottieni gli elementi top dell'utente (artisti o tracce)
   * @param {string} type - Tipo di elementi da ottenere ('artists' o 'tracks')
   * @param {Object} options - Opzioni per la richiesta
   * @returns {Promise<Object>} - Promessa che risolve con la risposta degli elementi top
   */
  async getTopItems(type, options = {}) {
    const { limit = 20, time_range = 'medium_term' } = options;

    try {
      await this.ensureAccessToken();

      const params = new URLSearchParams();
      params.append('limit', limit);
      params.append('time_range', time_range);

      const response = await axios.get(
        `https://api.spotify.com/v1/me/top/${type}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: params
      }
      );

      return response.data;
    } catch (error) {
      console.error(`Errore durante l'ottenimento dei top ${type}:`, error);
      if (error.response && (error.response.status === 403 || error.response.status === 404)) {
        console.log(`L'utente non ha abbastanza cronologia ${type}, restituisco array vuoto`);
        return { items: [] };
      }
      throw error;
    }
  }

  /**
   * Assicurati di avere un token di accesso valido
   */
  async ensureAccessToken() {
    if (!this.accessToken) {
      // Abbiamo bisogno del token di accesso dalla richiesta
      // Questo dovrebbe essere memorizzato in una sessione o fornito con ogni richiesta
      throw new Error('Token di accesso richiesto per questa operazione');
    }

    // Se abbiamo un tempo di scadenza e è passato, aggiorna il token
    if (this.tokenExpiration && Date.now() > this.tokenExpiration) {
      await this.refreshToken();
    }

    return this.accessToken;
  }

  /**
   * Imposta il token di accesso per le chiamate API
   * @param {string} token - Il token di accesso
   * @param {number} expiresIn - Tempo in secondi fino alla scadenza del token
   */
  setAccessToken(token, expiresIn = 3600) {
    this.accessToken = token;
    this.tokenExpiration = Date.now() + (expiresIn * 1000);
    console.log('Token di accesso impostato, scade in', expiresIn, 'secondi');
  }

  /**
   * Crea una nuova playlist
   * @param {string} accessToken - Il token di accesso
   * @param {string} userId - ID utente Spotify
   * @param {Object} options - Opzioni della playlist (nome, descrizione, pubblica)
   * @returns {Promise<Object>} - Dati della playlist creata
   */
  async createPlaylist(accessToken, userId, options = {}) {
    const name = options.name || `Find That Song - ${new Date().toLocaleDateString()}`;
    const description = options.description || 'Created with Find That Song app';
    const isPublic = options.isPublic !== undefined ? options.isPublic : true;

    try {
      console.log(`Creazione playlist "${name}" per l'utente ${userId}`);

      const response = await axios.post(
        `https://api.spotify.com/v1/users/${userId}/playlists`, {
        name: name,
        description: description,
        public: isPublic
      },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Playlist creata con ID: ${response.data.id}`);
      return response.data;
    } catch (error) {
      console.error('Errore durante la creazione della playlist:', error);
      if (error.response) {
        console.error('Stato risposta:', error.response.status);
        console.error('Dati risposta:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Aggiungi tracce a una playlist
   * @param {string} accessToken - Token di accesso Spotify
   * @param {string} playlistId - ID della playlist
   * @param {Array<string>} trackUris - URI delle tracce da aggiungere
   * @returns {Promise<Object>} - Risposta API
   */
  async addTracksToPlaylist(accessToken, playlistId, trackUris) {
    try {
      // Valida gli input
      if (!Array.isArray(trackUris) || trackUris.length === 0) {
        console.error('Nessun URI di traccia fornito per aggiungere alla playlist');
        throw new Error('Nessuna traccia fornita per aggiungere alla playlist');
      }

      console.log(`Aggiunta di ${trackUris.length} tracce alla playlist ${playlistId}`);
      console.log('Prime poche URI:', trackUris.slice(0, 3));

      const response = await axios.post(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        uris: trackUris
      },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Tracce aggiunte con successo');
      return response.data;
    } catch (error) {
      console.error('Errore durante l\'aggiunta delle tracce alla playlist:', error);
      if (error.response) {
        console.error('Stato risposta:', error.response.status);
        console.error('Dati risposta:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Ottieni le playlist di un utente
   * @param {string} accessToken - Token di accesso Spotify
   * @param {number} limit - Numero massimo di playlist da restituire
   * @returns {Promise<Array>} - Playlist dell'utente
   */
  async getUserPlaylists(accessToken, limit = 50) {
    try {
      const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        params: { limit }
      });

      console.log(`Recuperate ${response.data.items.length} playlist per l'utente`);
      return response.data.items;
    } catch (error) {
      console.error('Errore durante l\'ottenimento delle playlist dell\'utente:', error.message);
      return [];
    }
  }

  /**
   * Controlla se esiste una playlist con il nome specificato per l'utente
   * @param {string} accessToken - Token di accesso Spotify
   * @param {string} playlistName - Nome da cercare
   * @returns {Promise<Object|null>} - La playlist esistente o null
   */
  async findPlaylistByName(accessToken, playlistName) {
    try {
      if (!playlistName) return null;

      console.log(`Cerco playlist esistente chiamata "${playlistName}"`);
      const playlists = await this.getUserPlaylists(accessToken);

      // Confronto case-insensitive per trovare una playlist corrispondente
      const existingPlaylist = playlists.find(
        playlist => playlist.name.toLowerCase() === playlistName.toLowerCase()
      );

      if (existingPlaylist) {
        console.log(`Trovata playlist esistente con ID: ${existingPlaylist.id}`);
        return existingPlaylist;
      } else {
        console.log(`Nessuna playlist esistente trovata con nome "${playlistName}"`);
        return null;
      }
    } catch (error) {
      console.error('Errore durante la ricerca della playlist per nome:', error.message);
      return null;
    }
  }

  /**
   * Ottieni tutte le tracce da una playlist
   * @param {string} accessToken - Token di accesso Spotify
   * @param {string} playlistId - ID della playlist
   * @returns {Promise<Array>} - Array di tracce
   */
  async getPlaylistTracks(accessToken, playlistId) {
    try {
      let allTracks = [];
      let nextUrl = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`;

      // Pagina attraverso tutte le tracce
      while (nextUrl) {
        const response = await axios.get(nextUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (response.data.items) {
          allTracks = allTracks.concat(response.data.items.map(item => item.track));
        }

        nextUrl = response.data.next;
      }

      console.log(`Recuperate ${allTracks.length} tracce dalla playlist ${playlistId}`);
      return allTracks;
    } catch (error) {
      console.error('Errore durante l\'ottenimento delle tracce della playlist:', error.message);
      return [];
    }
  }

  /**
   * Filtra le tracce che già esistono nella playlist
   * @param {Array} newTracks - Array di nuove tracce da aggiungere
   * @param {Array} existingTracks - Array di tracce già nella playlist
   * @returns {Array} - Array di tracce filtrate
   */
  filterDuplicateTracks(newTracks, existingTracks) {
    if (!existingTracks || existingTracks.length === 0) {
      return newTracks;
    }

    // Crea un set di URI di tracce esistenti per una ricerca più veloce
    const existingTrackUris = new Set(
      existingTracks.map(track => track.uri).filter(Boolean)
    );

    console.log(`Filtraggio contro ${existingTrackUris.size} tracce esistenti`);

    // Filtra le tracce che già esistono nella playlist
    const uniqueTracks = newTracks.filter(track => {
      return track && track.uri && !existingTrackUris.has(track.uri);
    });

    console.log(`Trovate ${uniqueTracks.length} nuove tracce uniche su ${newTracks.length} tracce`);
    return uniqueTracks;
  }

  /**
   * Ottieni le caratteristiche audio di una traccia
   * @param {string} accessToken - Token di accesso Spotify
   * @param {string} trackId - ID della traccia
   * @returns {Promise<Object>} - Caratteristiche audio
   */
  async getTrackAudioFeatures(accessToken, trackId) {
    try {
      console.log(`Ottenimento caratteristiche audio per traccia: ${trackId}`);

      const response = await axios.get(`https://api.spotify.com/v1/audio-features/${trackId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('Caratteristiche audio non disponibili per questa traccia (403 Forbidden)');
        return null;
      }
      throw error;
    }
  }

  /**
   * Ottieni l'analisi audio di una traccia
   * @param {string} accessToken - Token di accesso Spotify
   * @param {string} trackId - ID della traccia
   * @returns {Promise<Object>} - Analisi audio
   */
  async getTrackAudioAnalysis(accessToken, trackId) {
    try {
      console.log(`Ottenimento analisi audio per traccia: ${trackId}`);

      const response = await axios.get(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      return response.data;
    } catch (error) {
      console.error('Errore durante l\'ottenimento dell\'analisi audio della traccia:', error.message);
      throw error;
    }
  }

  /**
   * Ottieni una versione semplificata dell'analisi audio di una traccia
   * @param {string} accessToken - Token di accesso Spotify
   * @param {string} trackId - ID della traccia
   * @returns {Promise<Object>} - Analisi audio semplificata
   */
  async getSimplifiedAudioAnalysis(accessToken, trackId) {
    try {
      console.log(`Ottenimento analisi audio semplificata per traccia: ${trackId}`);

      const response = await axios.get(`https://api.spotify.com/v1/audio-analysis/${trackId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      // Estrai solo le informazioni necessarie per ridurre la dimensione del payload
      const data = response.data;
      return {
        duration: data.track.duration,
        tempo: data.track.tempo,
        time_signature: data.track.time_signature,
        key: data.track.key,
        mode: data.track.mode,
        sections_count: data.sections.length,
        segments_count: data.segments.length,
        bars_count: data.bars.length,
        beats_count: data.beats.length
      };
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('Analisi audio non disponibile per questa traccia (403 Forbidden)');
        return null;
      }
      throw error;
    }
  }

  /**
   * Ottieni dettagli di una traccia
   * @param {string} accessToken - Token di accesso Spotify
   * @param {string} trackId - ID della traccia
   * @returns {Promise<Object>} - Dettagli della traccia
   */
  async getTrack(accessToken, trackId) {
    try {
      console.log(`Ottenimento dettagli della traccia per: ${trackId}`);

      const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      return response.data;
    } catch (error) {
      console.error('Errore durante l\'ottenimento dei dettagli della traccia:', error.message);
      throw error;
    }
  }

  /**
   * Ottieni un'analisi completa della traccia inclusi dettagli della traccia, caratteristiche audio e analisi semplificata
   * @param {string} accessToken - Token di accesso Spotify
   * @param {string} trackId - ID della traccia
   * @returns {Promise<Object>} - Analisi completa della traccia
   */
  async getTrackAnalysis(accessToken, trackId) {
    try {
      // Ottieni dettagli della traccia, caratteristiche audio e analisi audio in parallelo
      const [track, audioFeatures, audioAnalysis] = await Promise.all([
        this.getTrack(accessToken, trackId),
        this.getTrackAudioFeatures(accessToken, trackId),
        this.getTrackAudioAnalysis(accessToken, trackId).catch(error => {
          // L'analisi audio può essere pesante, quindi gestisci il fallimento con grazia
          console.warn('Analisi audio fallita, continuo senza di essa:', error.message);
          return null;
        })
      ]);

      // Prepara una versione semplificata dell'analisi audio (che può essere molto grande)
      const simplifiedAnalysis = audioAnalysis ? {
        duration: audioAnalysis.track.duration,
        tempo: audioAnalysis.track.tempo,
        time_signature: audioAnalysis.track.time_signature,
        key: audioAnalysis.track.key,
        mode: audioAnalysis.track.mode,
        sections_count: audioAnalysis.sections.length,
        segments_count: audioAnalysis.segments.length,
        bars_count: audioAnalysis.bars.length,
        beats_count: audioAnalysis.beats.length
      } : null;

      return {
        track,
        audioFeatures,
        analysis: simplifiedAnalysis
      };
    } catch (error) {
      console.error('Errore in getTrackAnalysis:', error.message);
      throw error;
    }
  }
}

module.exports = new SpotifyService();
