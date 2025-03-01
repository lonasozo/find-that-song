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

## Test Locale con Vercel Dev

Prima di deployare su Vercel, puoi testare l'applicazione in locale usando `vercel dev`:

1. **Installa Vercel CLI** (se non già fatto):
   ```bash
   npm install -g vercel
   ```

2. **Autenticati su Vercel**:
   ```bash
   vercel login
   ```

3. **Collega il progetto a Vercel** (solo la prima volta):
   ```bash
   vercel link
   ```
   - Segui le istruzioni per collegare il progetto al tuo account Vercel

4. **Configura le variabili d'ambiente locali**:
   - Vercel copierà automaticamente le variabili d'ambiente dal progetto remoto
   - Puoi anche creare un file `.env.local` per le configurazioni di sviluppo

5. **Avvia il server di sviluppo locale**:
   ```bash
   vercel dev
   ```
   - Questo comando emulerà l'ambiente Vercel in locale
   - L'applicazione sarà disponibile all'indirizzo `http://localhost:3000`

6. **Imposta il redirect URI su Spotify**:
   - Durante i test locali, aggiungi `http://localhost:3000/callback` come URI di redirect nella dashboard di Spotify Developer

> **Nota**: Usando `vercel dev`, testerai l'applicazione con la stessa configurazione serverless che avrà in produzione, garantendo maggiore affidabilità del deployment.

## Deployment su Vercel

Per deployare questa applicazione su Vercel:

1. **Configura le Variabili d'Ambiente su Vercel**:
   - `SPOTIFY_CLIENT_ID`: Il tuo Client ID Spotify
   - `SPOTIFY_CLIENT_SECRET`: Il tuo Client Secret Spotify
   - `SPOTIFY_REDIRECT_URI`: L'URL di callback (es. `https://tuo-progetto.vercel.app/callback`)

2. **Aggiorna le Impostazioni Spotify**:
   - Accedi al [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
   - Seleziona la tua app
   - Aggiungi l'URL di redirect di produzione (es. `https://tuo-progetto.vercel.app/callback`)
   - Salva le modifiche

3. **Comandi per il Deploy**:
   ```bash
   # Installazione di Vercel CLI (se non già fatto)
   npm install -g vercel
   
   # Login su Vercel
   vercel login
   
   # Deploy
   vercel
   
   # Deploy in produzione
   vercel --prod
   ```

4. **Verifica il Deployment**:
   - Visita l'URL fornito da Vercel dopo il deploy
   - Verifica che l'autenticazione Spotify funzioni correttamente
   - Controlla che le tue recently played tracks siano visibili

> Nota: Assicurati che il file `vercel.json` sia presente nella root del progetto.

## Contribuire

Se desideri contribuire a questo progetto, apri una pull request o segnala un problema.

## Licenza

Questo progetto è sotto licenza MIT. Vedi il file LICENSE per maggiori dettagli.

> Assicurati di sostituire `your_spotify_client_id`, `your_spotify_client_secret`, e `your_spotify_redirect_uri` con i valori corretti.