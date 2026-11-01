const https = require('https');
const fs = require('fs');
const path = require('path');

const FORWARD_EMAIL = 'ceo@zionsoftwareagency.com';
const LEADS_FILE = process.env.VERCEL ? path.join('/tmp', 'leads.json') : path.join(__dirname, '..', 'leads.json');

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

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    const lead = await parseBody(req);

    if (!lead.email || !lead.phone) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
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

    // 1. Try persisting to leads.json (survives read-only environments gracefully)
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

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({
      success: true,
      message: `Booking successfully saved and forwarded to ${FORWARD_EMAIL}`,
      lead: newLead,
      emailStatus: emailResult
    }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(JSON.stringify({ error: 'Failed to process demo booking', details: err.message }));
  }
};
