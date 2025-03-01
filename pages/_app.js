import { Analytics } from '@vercel/analytics/react';
import '../styles/globals.css'; // Assumendo che tu abbia questo import (se non esiste, rimuovilo)

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}

export default MyApp;
