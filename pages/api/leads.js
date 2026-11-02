const fs = require('fs');
const path = require('path');

const FORWARD_EMAIL = 'ceo@zionsoftwareagency.com';
const LEADS_FILE = path.join(process.env.VERCEL ? '/tmp' : (process.cwd() || __dirname), 'leads.json');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  let leads = [];
  try {
    if (fs.existsSync(LEADS_FILE)) {
      leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8') || '[]');
    }
  } catch (e) {
    leads = [];
  }

  return res.status(200).json({ count: leads.length, forwardedTo: FORWARD_EMAIL, leads });
}
