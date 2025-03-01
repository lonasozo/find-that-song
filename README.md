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
   ```

2. Installa le dipendenze:
   ```bash
   npm install
   ```

3. Crea un file .env nella root del progetto e aggiungi le seguenti variabili d'ambiente:
   ```
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=your_spotify_redirect_uri
   ```

## Utilizzo

1. Avvia l'applicazione:
   ```bash
   node index.js
   ```

2. Apri il browser e vai all'URL:
   ```
   http://localhost:3000/login
   ```

3. Accedi con il tuo account Spotify e autorizza l'applicazione.

4. Verrai reindirizzato alla pagina con l'elenco delle canzoni riprodotte di recente.

## Contribuire

Se desideri contribuire a questo progetto, apri una pull request o segnala un problema.

## Licenza

Questo progetto è sotto licenza MIT. Vedi il file LICENSE per maggiori dettagli.

> Assicurati di sostituire `your_spotify_client_id`, `your_spotify_client_secret`, e `your_spotify_redirect_uri` con i valori corretti.