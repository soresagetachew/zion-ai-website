const fs = require('fs');
const path = require('path');

const FORWARD_EMAIL = 'ceo@zionsoftwareagency.com';
const LEADS_FILE = process.env.VERCEL ? path.join('/tmp', 'leads.json') : path.join(__dirname, '..', 'leads.json');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  let leads = [];
  try {
    if (fs.existsSync(LEADS_FILE)) {
      leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8') || '[]');
    }
  } catch (e) {
    leads = [];
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify({ count: leads.length, forwardedTo: FORWARD_EMAIL, leads }));
};
