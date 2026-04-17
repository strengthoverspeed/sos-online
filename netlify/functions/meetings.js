const crypto = require('crypto');

const CALENDAR_ID = 'ff8ca5c2afc3c79a7d30bf416b943bfad8c051a93214634a1d60992de8f42cd5@group.calendar.google.com';
const DAY_ORDER = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
const TZ = 'America/Los_Angeles';

function ptFormat(date, opts) {
  return new Intl.DateTimeFormat('en-US', { ...opts, timeZone: TZ }).format(date);
}

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
    'Cache-Control': 'no-store',
  };

  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY;
    if (!email || !key) throw new Error('Missing service account env vars');

    const token = await getAccessToken(email, key, 'https://www.googleapis.com/auth/calendar.readonly');

    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString();
    const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`);
    url.searchParams.set('timeMin', timeMin);
    url.searchParams.set('timeMax', timeMax);
    url.searchParams.set('singleEvents', 'true');
    url.searchParams.set('orderBy', 'startTime');
    url.searchParams.set('maxResults', '50');

    const calRes = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    const calData = await calRes.json();
    if (calData.error) throw new Error(`Calendar error: ${JSON.stringify(calData.error)}`);

    const seen = new Set();
    const meetings = [];

    for (const event of (calData.items || [])) {
      const startStr = event.start?.dateTime || event.start?.date;
      if (!startStr) continue;
      const date = new Date(startStr);
      const day = event.start?.dateTime
        ? ptFormat(date, { weekday: 'long' })
        : 'All Day';
      const time = event.start?.dateTime
        ? ptFormat(date, { hour: 'numeric', minute: '2-digit', hour12: true })
        : 'All Day';
      const dedupKey = `${day}-${time}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      const loc = (event.location || '').trim();
      const summary = (event.summary || '').toLowerCase();
      const isOnline = /zoom|online|http|virtual/i.test(loc) || summary.includes('online');
      meetings.push({ day, time, location: loc, online: isOnline, summary: event.summary || 'SOS Meeting' });
    }

    meetings.sort((a, b) => DAY_ORDER[a.day] - DAY_ORDER[b.day]);
    return { statusCode: 200, headers: responseHeaders, body: JSON.stringify({ meetings }) };
  } catch (err) {
    return { statusCode: 500, headers: responseHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
