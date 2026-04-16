const crypto = require('crypto');

function base64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function makeJWT(email, privateKey, scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: email, scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, iat: now,
  }));
  const sigInput = `${header}.${payload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(sigInput);
  const pem = privateKey.replace(/\\n/g, '\n');
  return `${sigInput}.${base64url(signer.sign(pem))}`;
}

async function getAccessToken(email, privateKey, scope) {
  const jwt = makeJWT(email, privateKey, scope);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Token error: ${JSON.stringify(data)}`);
  return data.access_token;
}

exports.handler = async () => {
  const responseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=3600',
  };

  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY;
    const spreadsheetId = process.env.SPREADSHEET_ID;
    if (!email || !key || !spreadsheetId) throw new Error('Missing required env vars');

    const token = await getAccessToken(email, key, 'https://www.googleapis.com/auth/spreadsheets.readonly');

    // Get sheet metadata to discover tab names
    const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meta = await metaRes.json();
    if (meta.error) throw new Error(`Sheets metadata error: ${JSON.stringify(meta.error)}`);

    const sheetNames = (meta.sheets || []).map(s => s.properties.title);

    // Read each sheet in parallel
    const sheetResults = await Promise.all(sheetNames.map(async (sheetName) => {
      const rangeRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const rangeData = await rangeRes.json();
      const rows = rangeData.values || [];
      if (rows.length < 2) return [sheetName, []];

      const [colHeaders, ...dataRows] = rows;
      const records = dataRows
        .filter(row => row.some(cell => cell))
        .map(row => {
          const obj = {};
          colHeaders.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
          return obj;
        });
      return [sheetName, records];
    }));

    const result = Object.fromEntries(sheetResults);
    return { statusCode: 200, headers: responseHeaders, body: JSON.stringify(result) };
  } catch (err) {
    return { statusCode: 500, headers: responseHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
