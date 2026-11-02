import '../styles/globals.css';
import Head from 'next/head';

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Zion AI — AI-Powered Call Center & Voice Receptionist for Ethiopia</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
