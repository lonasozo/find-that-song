
Markdown
# Find That Song

Find That Song è un'applicazione web che ti aiuta a trovare le canzoni che hai ascoltato di recente su Spotify, ma di cui non ti ricordi il nome o che non hai fatto in tempo a salvare.

## Caratteristiche

- Autenticazione tramite Spotify
- Recupera l'elenco delle canzoni riprodotte di recente
- Visualizza i dettagli delle canzoni, inclusi nome, album, artisti e data di riproduzione
- Link diretto per ascoltare la canzone su Spotify

## Installazione

1. Clona il repository:
   ```bash
   git clone https://github.com/lonasozo/find-that-song.git
   cd find-that-song
Installa le dipendenze:

bash
npm install
Crea un file .env nella root del progetto e aggiungi le seguenti variabili d'ambiente:

plaintext
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_REDIRECT_URI=your_spotify_redirect_uri
Utilizzo
Avvia l'applicazione:

bash
node index.js
Apri il browser e vai all'URL:

Code
http://localhost:3000/login
Accedi con il tuo account Spotify e autorizza l'applicazione.

Verrai reindirizzato alla pagina con l'elenco delle canzoni riprodotte di recente.

Contribuire
Se desideri contribuire a questo progetto, apri una pull request o segnala un problema.

Licenza
Questo progetto è sotto licenza MIT. Vedi il file LICENSE per maggiori dettagli.

Code

Assicurati di sostituire `your_spotify_client_id`, `your_spotify_client_secret`, e `your_spotify_redirect_uri` con i valori corretti.