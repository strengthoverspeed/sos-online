const https = require('https');
const http = require('http');

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

function fetchText(url, redirects) {
  if (redirects === undefined) redirects = 0;
  if (redirects > 5) return Promise.reject(new Error('Too many redirects'));
  return new Promise(function (resolve, reject) {
    var lib = url.startsWith('https') ? https : http;
    var req = lib.get(url, { headers: { 'User-Agent': 'node-https' } }, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        fetchText(res.headers.location, redirects + 1).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
        return;
      }
      var chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () { resolve(Buffer.concat(chunks).toString('utf8')); });
      res.on('error', reject);
    });
    req.on('error', reject);
  });
}

function parseCSV(text) {
  var rows = [];
  var field = '';
  var row = [];
  var inQuotes = false;

  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    var next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field.trim()); field = ''; }
      else if (ch === '\r' && next === '\n') { row.push(field.trim()); rows.push(row); row = []; field = ''; i++; }
      else if (ch === '\n' || ch === '\r') { row.push(field.trim()); rows.push(row); row = []; field = ''; }
      else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field.trim()); if (row.some(Boolean)) rows.push(row); }

  if (rows.length < 2) return [];
  var headers = rows[0];
  return rows.slice(1)
    .filter(function (r) { return r.some(Boolean); })
    .map(function (r) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = (r[i] || '').trim(); });
      return obj;
    });
}

exports.handler = function () {
  var responseHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };

  return Promise.all(
    TABS.map(function (tab) {
      return fetchText(tab.url).then(function (text) {
        return [tab.name, parseCSV(text)];
      });
    })
  ).then(function (results) {
    var result = {};
    results.forEach(function (r) { result[r[0]] = r[1]; });
    return { statusCode: 200, headers: responseHeaders, body: JSON.stringify(result) };
  }).catch(function (err) {
    return { statusCode: 500, headers: responseHeaders, body: JSON.stringify({ error: err.message }) };
  });
};
