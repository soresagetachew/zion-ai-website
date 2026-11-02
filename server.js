const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.ico': 'image/x-icon',
};

const FORWARD_EMAIL = 'ceo@zionsoftwareagency.com';
const LEADS_FILE = path.join(process.env.VERCEL ? '/tmp' : (process.cwd() || __dirname), 'leads.json');

// Helper to resolve files searching both process.cwd() and __dirname
function resolveFilePath(relPath) {
  const clean = relPath.replace(/^\/+/, '');
  const candidates = [
    path.join(__dirname, clean),
    path.join(process.cwd(), clean),
    path.resolve(clean),
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch (e) {}
  }
  return null;
}

// Preload core assets at cold start.
// Literal string references ensure @vercel/nft traces and bundles them.
let cachedIndex = '';
let cachedStyles = '';
let cachedScript = '';

try {
  cachedIndex = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
} catch (e) {
  try {
    cachedIndex = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  } catch (err) {}
}

try {
  cachedStyles = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
} catch (e) {
  try {
    cachedStyles = fs.readFileSync(path.join(process.cwd(), 'styles.css'), 'utf8');
  } catch (err) {}
}

try {
  cachedScript = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf8');
} catch (e) {
  try {
    cachedScript = fs.readFileSync(path.join(process.cwd(), 'script.js'), 'utf8');
  } catch (err) {}
}

// Function to forward booking to email via Web3Forms if configured
function forwardEmailNotification(lead) {
  return new Promise((resolve) => {
    const accessKey = process.env.WEB3FORMS_ACCESS_KEY || '';
    if (!accessKey) {
      console.log(`[Demo Booking Stored for ${FORWARD_EMAIL}]:`, lead.company, lead.email, lead.phone);
      return resolve({
        sent: false,
        stored: true,
        recipient: FORWARD_EMAIL,
        note: 'Saved in leads log. Set WEB3FORMS_ACCESS_KEY in environment variables for automated email relay.'
      });
    }

    const payload = JSON.stringify({
      access_key: accessKey,
      subject: `🚨 New Zion AI Demo Booking: ${lead.company} (${lead.name})`,
      from_name: 'Zion AI Voice Bot Booking',
      to: FORWARD_EMAIL,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      preferred_languages: lead.language,
      notes: lead.notes || 'None',
      booking_id: lead.id,
      timestamp: lead.timestamp
    });

    const options = {
      hostname: 'api.web3forms.com',
      port: 443,
      path: '/submit',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[Email Forwarded to ${FORWARD_EMAIL}] Status:`, res.statusCode);
        resolve({ sent: res.statusCode === 200, response: data });
      });
    });

    req.on('error', (err) => {
      console.error('[Email Relay Error]', err.message);
      resolve({ sent: false, error: err.message });
    });

    req.write(payload);
    req.end();
  });
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }
  if (req.body && typeof req.body === 'string') {
    try {
      return Promise.resolve(JSON.parse(req.body));
    } catch (e) {
      return Promise.resolve({});
    }
  }
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

async function handleBookDemo(req, res) {
  try {
    const lead = await parseBody(req);

    if (!lead.email || !lead.phone) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'Email and phone number are required.' }));
    }

    const newLead = {
      id: `ZION-${Date.now()}`,
      timestamp: new Date().toISOString(),
      forwardedTo: FORWARD_EMAIL,
      name: lead.name || 'Anonymous',
      email: lead.email,
      phone: lead.phone,
      company: lead.company || 'Not specified',
      language: lead.language || 'Amharic & English',
      notes: lead.notes || '',
      ip: (req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || req.socket?.remoteAddress || '',
      status: 'FORWARDED_TO_CEO'
    };

    // 1. Try persisting to leads.json (safely handles read-only serverless filesystems)
    try {
      let leads = [];
      if (fs.existsSync(LEADS_FILE)) {
        try {
          leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8') || '[]');
        } catch (e) {
          leads = [];
        }
      }
      leads.unshift(newLead);
      fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
    } catch (fsErr) {
      console.warn('[Leads persistence notice]:', fsErr.message);
    }

    // 2. Forward to ceo@zionsoftwareagency.com
    const emailResult = await forwardEmailNotification(newLead);

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({
      success: true,
      message: `Booking successfully saved and forwarded to ${FORWARD_EMAIL}`,
      lead: newLead,
      emailStatus: emailResult
    }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error: 'Failed to process demo booking', details: err.message }));
  }
}

function handleGetLeads(req, res) {
  let leads = [];
  try {
    if (fs.existsSync(LEADS_FILE)) {
      leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8') || '[]');
    }
  } catch (e) {
    leads = [];
  }
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  return res.end(JSON.stringify({ count: leads.length, forwardedTo: FORWARD_EMAIL, leads }));
}

// Master HTTP request handler
function requestHandler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const rawUrl = req.url || '/';
  const reqPath = decodeURIComponent(rawUrl.split('?')[0]);

  // 1. API Routes
  if (req.method === 'POST' && reqPath === '/api/book-demo') {
    return handleBookDemo(req, res);
  }
  if (req.method === 'GET' && reqPath === '/api/leads') {
    return handleGetLeads(req, res);
  }

  // 2. Core Static Assets (Served with 100% in-memory reliability)
  if (reqPath === '/styles.css') {
    let content = cachedStyles;
    if (!content) {
      const p = resolveFilePath('styles.css');
      if (p) content = fs.readFileSync(p, 'utf8');
    }
    res.writeHead(200, {
      'Content-Type': 'text/css; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(content || '');
  }

  if (reqPath === '/script.js') {
    let content = cachedScript;
    if (!content) {
      const p = resolveFilePath('script.js');
      if (p) content = fs.readFileSync(p, 'utf8');
    }
    res.writeHead(200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(content || '');
  }

  if (reqPath === '/' || reqPath === '' || reqPath === '/index.html') {
    let content = cachedIndex;
    if (!content) {
      const p = resolveFilePath('index.html');
      if (p) content = fs.readFileSync(p, 'utf8');
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(content || '');
  }

  // 3. Other static files (assets/fonts, assets/images, logos, etc.)
  const filePath = resolveFilePath(reqPath);
  if (filePath && fs.existsSync(filePath)) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': stat.size,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*'
        });
        return fs.createReadStream(filePath).pipe(res);
      }
    } catch (err) {}
  }

  // 4. SPA Fallback for extensionless subpaths
  if (path.extname(reqPath) === '') {
    let content = cachedIndex;
    if (!content) {
      const p = resolveFilePath('index.html');
      if (p) content = fs.readFileSync(p, 'utf8');
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, must-revalidate',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(content || '');
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
}

// Export for Vercel Serverless Function
module.exports = requestHandler;

// Standalone listener for local dev (`node server.js` / `npm start`)
if (require.main === module || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  const server = http.createServer(requestHandler);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Zion AI server active at: http://localhost:${PORT}/`);
    console.log(`Demo booking endpoint: http://localhost:${PORT}/api/book-demo`);
    console.log(`Leads endpoint: http://localhost:${PORT}/api/leads`);
  });
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      const nextPort = Number(PORT) + 1;
      server.listen(nextPort, '0.0.0.0');
    } else {
      console.error('Server error:', e);
    }
  });
}
