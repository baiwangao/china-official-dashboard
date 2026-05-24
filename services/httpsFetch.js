const fs = require('fs');
const { execSync } = require('child_process');
const { Agent, fetch: undiciFetch } = require('undici');

let dispatcher;

function resolveCaPath() {
  if (process.env.NODE_EXTRA_CA_CERTS) {
    try {
      if (fs.existsSync(process.env.NODE_EXTRA_CA_CERTS)) return process.env.NODE_EXTRA_CA_CERTS;
    } catch (_) {}
  }

  const candidates = ['/etc/ssl/cert.pem', '/private/etc/ssl/cert.pem'];
  try {
    const brew = execSync('brew --prefix openssl@3 2>/dev/null', { encoding: 'utf8' }).trim();
    if (brew) candidates.push(`${brew}/etc/openssl@3/cert.pem`);
  } catch (_) {}

  return candidates.find((p) => {
    try {
      return fs.existsSync(p);
    } catch {
      return false;
    }
  });
}

function getDispatcher() {
  if (dispatcher !== undefined) return dispatcher;

  const caPath = resolveCaPath();
  if (!caPath) {
    dispatcher = null;
    return null;
  }

  try {
    dispatcher = new Agent({ connect: { ca: fs.readFileSync(caPath) } });
    console.log(`[HTTPS] Using CA bundle: ${caPath}`);
  } catch (err) {
    console.warn('[HTTPS] Failed to load CA bundle:', err.message);
    dispatcher = null;
  }
  return dispatcher;
}

/** Node fetch on macOS may fail TLS without system CA; undici + cert bundle fixes it. */
async function httpsFetch(url, options = {}) {
  const d = getDispatcher();
  if (d) return undiciFetch(url, { ...options, dispatcher: d });
  return fetch(url, options);
}

module.exports = { httpsFetch };
