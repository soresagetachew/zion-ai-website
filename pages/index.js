import React, { useEffect } from 'react';
import Script from 'next/script';
import fs from 'fs';
import path from 'path';

export default function Home({ bodyContent }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.initZionAI === 'function') {
      window.initZionAI();
    }
  }, []);

  return (
    <>
      <div
        id="zion-root-content"
        dangerouslySetInnerHTML={{ __html: bodyContent }}
      />
      <Script
        src="/script.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && typeof window.initZionAI === 'function') {
            window.initZionAI();
          }
        }}
      />
    </>
  );
}

export async function getStaticProps() {
  const filePath = path.join(process.cwd(), 'index.html');
  const rawHtml = fs.readFileSync(filePath, 'utf8');

  // Extract everything inside <body>...</body>
  const bodyMatch = rawHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyContent = bodyMatch ? bodyMatch[1] : rawHtml;

  // Clean out the old script tag since Next.js <Script> handles it
  bodyContent = bodyContent.replace(/<script\s+src="script\.js"[^>]*><\/script>/gi, '');

  return {
    props: {
      bodyContent,
    },
  };
}
