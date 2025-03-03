document.addEventListener('DOMContentLoaded', function () {
  // Selettori per il time range
  const timeRangeButtons = document.querySelectorAll('.time-range-btn');
  const contentContainer = document.getElementById('content-container');
  const timeRangeLoader = document.getElementById('time-range-loader');

  // Funzione per ottenere il token dall'URL
  function getAccessTokenFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('access_token');
  }

  // Funzione per ottenere il tipo di contenuto corrente
  function getCurrentContentType() {
    const path = window.location.pathname;
    if (path.includes('top-tracks')) return 'top-tracks';
    if (path.includes('top-artists')) return 'top-artists';
    if (path.includes('top-albums')) return 'top-albums';
    return null;
  }

  // Listener per i pulsanti time range
  timeRangeButtons.forEach(button => {
    button.addEventListener('click', function () {
      const timeRange = this.getAttribute('data-range');

      // Skip se già attivo
      if (this.classList.contains('active')) return;

      // Aggiorna stato attivo
      timeRangeButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      // Ottieni token e tipo di contenuto
      const accessToken = getAccessTokenFromUrl();
      const contentType = getCurrentContentType();

      if (!accessToken || !contentType) {
        console.error('Access token o content type mancante');
        return;
      }

      // Mostra loader
      if (timeRangeLoader) {
        timeRangeLoader.style.display = 'flex';
      }
      if (contentContainer) {
        contentContainer.style.opacity = '0.5';
      }

      // Costruisci URL mantenendo la struttura con token
      const url = `/${contentType}?access_token=${accessToken}&time_range=${timeRange}&ajax=true`;
      console.log(`Fetching data from: ${url}`);

      // Chiamata AJAX - Gestiamo sia risposte HTML che JSON
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }

          // Controlliamo il content-type della risposta
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return response.json().then(data => {
              return { type: 'json', data };
            });
          } else {
            // Assumiamo che sia HTML
            return response.text().then(html => {
              return { type: 'html', data: html };
            });
          }
        })
        .then(result => {
          // Aggiorna il contenuto in base al tipo di risposta
          if (result.type === 'json') {
            // Se la risposta è JSON
            updateContentFromJson(contentType, result.data);
          } else {
            // Se la risposta è HTML
            updateContentFromHtml(result.data);
          }

          // Nascondi loader
          if (timeRangeLoader) {
            timeRangeLoader.style.display = 'none';
          }
          if (contentContainer) {
            contentContainer.style.opacity = '1';
          }
        })
        .catch(error => {
          console.error('Errore nel recupero dei dati:', error);

          if (timeRangeLoader) {
            timeRangeLoader.style.display = 'none';
          }
          if (contentContainer) {
            contentContainer.style.opacity = '1';
          }

          alert(`Errore nel caricamento: ${error.message}`);
        });
    });
  });

  // Funzione per aggiornare il contenuto da HTML
  function updateContentFromHtml(html) {
    if (!contentContainer) return;

    // Sostituisci direttamente l'HTML
    contentContainer.innerHTML = html;

    // Reinizializza gli handlers dopo aver sostituito il contenuto
    if (typeof initializeTrackEventHandlers === 'function') {
      setTimeout(initializeTrackEventHandlers, 0);
    }
  }

  // Funzione per aggiornare il contenuto da JSON (se necessario)
  function updateContentFromJson(contentType, data) {
    if (!contentContainer) return;

    switch (contentType) {
      case 'top-tracks':
        if (data.tracks) {
          updateTopTracks(data.tracks);
        }
        break;
      case 'top-artists':
        if (data.artists) {
          updateTopArtists(data.artists);
        }
        break;
      case 'top-albums':
        if (data.albums) {
          updateTopAlbums(data.albums);
        }
        break;
      default:
        console.error('Tipo di contenuto non supportato:', contentType);
    }
  }

  // Funzione per aggiornare le Top Tracks
  function updateTopTracks(tracks) {
    const trackList = contentContainer.querySelector('.track-list');
    if (!trackList) return;

    let html = '';

    tracks.forEach((track, index) => {
      html += `
                <div class="track-item" data-spotify-url="${track.external_urls.spotify}">
                    <div class="track-number">${index + 1}</div>
                    <div class="track-image">
                        <a href="${track.external_urls.spotify}" target="_blank" class="cover-link">
                            <img src="${track.album.images[0]?.url || '/img/default-album.png'}" alt="${track.name}" loading="lazy">
                            <div class="track-play-overlay">
                                <i class="fas fa-play"></i>
                            </div>
                        </a>
                    </div>
                    <div class="track-info">
                        <div class="track-name">
                            <a href="${track.external_urls.spotify}" target="_blank" class="track-link">
                                ${track.name}
                            </a>
                        </div>
                        <div class="track-artist">
                            ${track.artists.map((artist, i) =>
        `<a href="${artist.external_urls.spotify}" target="_blank" class="artist-link">
                                    ${artist.name}${i < track.artists.length - 1 ? ', ' : ''}
                                </a>`
      ).join('')}
                        </div>
                        <div class="track-meta">
                            <span class="track-album">
                                <a href="${track.album.external_urls.spotify}" target="_blank" class="album-link">
                                    ${track.album.name}
                                </a>
                            </span>
                            <span class="track-duration">Duration: ${formatDuration(track.duration_ms)}</span>
                            <span class="track-popularity">Popularity: ${track.popularity}/100</span>
                        </div>
                    </div>
                    <div class="track-actions">
                        <a href="${track.external_urls.spotify}" target="_blank" class="spotify-link">
                            <i class="fab fa-spotify"></i>
                        </a>
                    </div>
                </div>
            `;
    });

    trackList.innerHTML = html;

    // Re-inizializza event handlers
    if (typeof initializeTrackEventHandlers === 'function') {
      initializeTrackEventHandlers();
    }
  }

  // Funzione per aggiornare i Top Artists (da implementare quando necessario)
  function updateTopArtists(artists) {
    // Implementazione specifica per gli artisti
    console.log('Aggiornamento artisti con:', artists.length);
  }

  // Funzione per aggiornare i Top Albums (da implementare quando necessario)
  function updateTopAlbums(albums) {
    // Implementazione specifica per gli album
    console.log('Aggiornamento album con:', albums.length);
  }

  // Utility per formattare la durata
  function formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
});
