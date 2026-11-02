import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Zion AI is Ethiopia's premier voice AI phone receptionist. Answers calls 24/7 in Amharic, Afaan Oromoo, and English with Telebirr verification and seamless human handoff. Pricing in ETB." />
        <link rel="preload" href="/styles.css" as="style" />
        <link rel="stylesheet" href="/styles.css" />
        <style dangerouslySetInnerHTML={{ __html: `
          /* Clean & Accessible Baseline */
          html {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
            scroll-behavior: smooth;
            box-sizing: border-box;
          }
          *, *::before, *::after {
            box-sizing: inherit;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #faf8f1;
            color: #153e35;
            font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          :focus-visible {
            outline: 2px solid #153e35 !important;
            outline-offset: 3px !important;
          }
          .skip-link {
            position: absolute;
            top: -100px;
            left: 16px;
            background: #153e35;
            color: #dfff8b;
            padding: 10px 18px;
            border-radius: 999px;
            font-weight: 700;
            font-size: 13.5px;
            text-decoration: none;
            z-index: 99999;
            transition: top 160ms ease;
          }
          .skip-link:focus {
            top: 16px;
          }
        `}} />
      </Head>
      <body>
        <a href="#main" className="skip-link">Skip to main content</a>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
