const TABS = [
  {
    name: 'Support Groups',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPaKZ-CpAKxrCsuOnUsFNUZA6ANUuVV1JqmfEYC2q2sqJNWuNMEo1vW_L2YgZ3MJVM0xspc-f0rQVz/pub?gid=1943624258&single=true&output=csv',
  },
  {
    name: 'Counseling & Treatment',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPaKZ-CpAKxrCsuOnUsFNUZA6ANUuVV1JqmfEYC2q2sqJNWuNMEo1vW_L2YgZ3MJVM0xspc-f0rQVz/pub?gid=409498218&single=true&output=csv',
  },
  {
    name: 'Crisis & Help Lines',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPaKZ-CpAKxrCsuOnUsFNUZA6ANUuVV1JqmfEYC2q2sqJNWuNMEo1vW_L2YgZ3MJVM0xspc-f0rQVz/pub?gid=822688570&single=true&output=csv',
  },
  {
    name: 'Harm Reduction Vending Machine Locations',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPaKZ-CpAKxrCsuOnUsFNUZA6ANUuVV1JqmfEYC2q2sqJNWuNMEo1vW_L2YgZ3MJVM0xspc-f0rQVz/pub?gid=650734169&single=true&output=csv',
  },
  {
    name: 'HIV Testing & Sexual Health',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPaKZ-CpAKxrCsuOnUsFNUZA6ANUuVV1JqmfEYC2q2sqJNWuNMEo1vW_L2YgZ3MJVM0xspc-f0rQVz/pub?gid=1091868866&single=true&output=csv',
  },
];

function parseCSV(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field.trim());
        field = '';
      } else if (ch === '\r' && next === '\n') {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        row.push(field.trim());
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }
  if (field || row.length) {
    row.push(field.trim());
    if (row.some(Boolean)) rows.push(row);
  }

  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1)
    .filter(r => r.some(Boolean))
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = (r[i] || '').trim(); });
      return obj;
    });
}

exports.handler = async () => {
  const responseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=3600',
  };

  try {
    const results = await Promise.all(
      TABS.map(async ({ name, url }) => {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching tab "${name}"`);
        const text = await res.text();
        return [name, parseCSV(text)];
      })
    );

    const result = Object.fromEntries(results);
    return { statusCode: 200, headers: responseHeaders, body: JSON.stringify(result) };
  } catch (err) {
    return { statusCode: 500, headers: responseHeaders, body: JSON.stringify({ error: err.message }) };
  }
};
