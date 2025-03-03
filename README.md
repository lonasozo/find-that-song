# Find That Song

Find That Song is a web application that helps you find songs you've recently listened to on Spotify, check some details about your listening history, and create new playlists.
It is already [deployed on Vercel](https://find-that-song.vercel.app/).

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/lonasozo/find-that-song.git
   cd find-that-song
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file in the project root and add the following environment variables:
   ```
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=your_spotify_redirect_uri
   ```

## Usage

1. Start the application:
   ```bash
   node index.js
   ```

2. Open your browser and go to:
   ```
   http://localhost:3000/login
   ```

3. Log in with your Spotify account and authorize the application.

4. You'll be redirected to the page with a list of your recently played songs.

## Local Testing with Vercel Dev

Before deploying to Vercel, you can test the application locally using `vercel dev`:

1. **Install Vercel CLI** (if not already done):
   ```bash
   npm install -g vercel
   ```

2. **Authenticate with Vercel**:
   ```bash
   vercel login
   ```

3. **Link the project to Vercel** (only the first time):
   ```bash
   vercel link
   ```
   - Follow the instructions to link the project to your Vercel account

4. **Configure local environment variables**:
   - Vercel will automatically copy environment variables from the remote project
   - You can also create a `.env.local` file for development configurations

5. **Start the local development server**:
   ```bash
   vercel dev
   ```
   - This command will emulate the Vercel environment locally
   - The application will be available at `http://localhost:3000`

6. **Set the redirect URI on Spotify**:
   - During local testing, add `http://localhost:3000/callback` as a redirect URI in the Spotify Developer dashboard

> **Note**: By using `vercel dev`, you'll test the application with the same serverless configuration it will have in production, ensuring greater deployment reliability.

## Deployment to Vercel

To deploy this application to Vercel:

1. **Configure Environment Variables on Vercel**:
   - `SPOTIFY_CLIENT_ID`: Your Spotify Client ID
   - `SPOTIFY_CLIENT_SECRET`: Your Spotify Client Secret
   - `SPOTIFY_REDIRECT_URI`: The callback URL (e.g., `https://your-project.vercel.app/callback`)

2. **Update Spotify Settings**:
   - Access the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
   - Select your app
   - Add the production redirect URL (e.g., `https://your-project.vercel.app/callback`)
   - Save the changes

3. **Deployment Commands**:
   ```bash
   # Install Vercel CLI (if not already done)
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy
   vercel
   
   # Production deployment
   vercel --prod
   ```

4. **Verify the Deployment**:
   - Visit the URL provided by Vercel after deployment
   - Verify that Spotify authentication works correctly
   - Check that your recently played tracks are visible

> Note: Make sure the `vercel.json` file is present in the project root.

## Contributing

If you wish to contribute to this project, open a pull request or report an issue.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

> Be sure to replace `your_spotify_client_id`, `your_spotify_client_secret`, and `your_spotify_redirect_uri` with the correct values.