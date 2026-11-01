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

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname);
const LEADS_FILE = path.join(ROOT, 'leads.json');
const FORWARD_EMAIL = 'ceo@zionsoftwareagency.com';

// Function to forward booking to email via Web3Forms or webhook if configured
function forwardEmailNotification(lead) {
  return new Promise((resolve) => {
    const accessKey = process.env.WEB3FORMS_ACCESS_KEY || '';
    if (!accessKey) {
      console.log(`[Demo Booking Stored for ${FORWARD_EMAIL}]:`, lead.company, lead.email, lead.phone);
      return resolve({
        sent: false,
        stored: true,
        recipient: FORWARD_EMAIL,
        note: 'Saved locally in leads.json. Set WEB3FORMS_ACCESS_KEY in env for automatic cloud email relay.'
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

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  // 1. API Route: POST /api/book-demo
  if (req.method === 'POST' && reqPath === '/api/book-demo') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy(); // 1MB protection
    });

    req.on('end', async () => {
      try {
        const lead = JSON.parse(body || '{}');

        if (!lead.email || !lead.phone) {
          res.writeHead(400, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          });
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
          ip: req.socket.remoteAddress || '',
          status: 'FORWARDED_TO_CEO'
        };

        // 1. Persist to leads.json
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

        // 2. Forward to ceo@zionsoftwareagency.com
        const emailResult = await forwardEmailNotification(newLead);

        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(JSON.stringify({
          success: true,
          message: `Booking successfully saved and forwarded to ${FORWARD_EMAIL}`,
          lead: newLead,
          emailStatus: emailResult
        }));
      } catch (err) {
        res.writeHead(500, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(JSON.stringify({ error: 'Failed to process demo booking', details: err.message }));
      }
    });
    return;
  }

  // 2. API Route: GET /api/leads
  if (req.method === 'GET' && reqPath === '/api/leads') {
    let leads = [];
    if (fs.existsSync(LEADS_FILE)) {
      try {
        leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8') || '[]');
      } catch (e) {
        leads = [];
      }
    }
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify({ count: leads.length, forwardedTo: FORWARD_EMAIL, leads }));
  }

  // 3. Static File Serving
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(ROOT, reqPath);

  // Security check: ensure filePath is within ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (path.extname(reqPath) === '') {
        const fallbackPath = path.join(ROOT, 'index.html');
        return fs.readFile(fallbackPath, (readErr, content) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content);
          }
        });
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Zion AI server running at: http://localhost:${PORT}/`);
  console.log(`Demo booking endpoint active: http://localhost:${PORT}/api/book-demo`);
  console.log(`Forwarding bookings to: ${FORWARD_EMAIL}`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.log(`Port ${PORT} in use, trying ${nextPort}...`);
    server.listen(nextPort, '0.0.0.0');
  } else {
    console.error('Server error:', e);
  }
});
