const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { hashEvent, sourceKey, titleKey } = require('./hashService');

const QUEUE_FILE = path.join(__dirname, '../data/chain-queue.json');
const EMPTY_QUEUE = { pending: [], committed: [], submitted: [], failed: [] };

let pool = null, dbOk = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'china-official',
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 3000,
      charset: 'utf8mb4'
    });
  }
  return pool;
}

async function tryDB(fn) {
  try {
    if (dbOk === false) throw new Error('offline');
    return await fn();
  } catch { dbOk = false; return null; }
}

// ===== enqueue (DB优先，JSON兜底) =====
async function enqueue(events) {
  if (!events || !events.length) return 0;

  const dbResult = await tryDB(async () => await enqueueDB(events));
  if (dbResult !== null) return dbResult;
  return await enqueueJSON(events);
}

async function enqueueDB(events) {
  const [knownHashes, knownRows] = await Promise.all([
    getPool().query('SELECT hash FROM chain_events'),
    getPool().query('SELECT event FROM chain_events WHERE event IS NOT NULL')
  ]);
  const hashSet = new Set(knownHashes[0].map(r => r.hash));
  const srcSet = new Set(), titSet = new Set();
  for (const r of knownRows[0]) {
    try { const ev = JSON.parse(r.event); const sk = sourceKey(ev); if (sk) srcSet.add(sk); const tk = titleKey(ev); if (tk) titSet.add(tk); } catch {}
  }
  let added = 0;
  for (const event of events) {
    const h = hashEvent(event);
    if (hashSet.has(h)) continue;
    const sk = sourceKey(event), tk = titleKey(event);
    if (sk && srcSet.has(sk)) continue;
    if (!sk && tk && titSet.has(tk)) continue;
    await getPool().query("INSERT INTO chain_events (queue_id, hash, event, status) VALUES (?,?,?,'pending')",
      [crypto.randomUUID(), h, JSON.stringify(event)]);
    hashSet.add(h); if (sk) srcSet.add(sk); if (tk) titSet.add(tk); added++;
  }
  return added;
}

async function enqueueJSON(events) {
  let queue;
  try { queue = JSON.parse(await fs.readFile(QUEUE_FILE, 'utf8')); } catch { queue = { ...EMPTY_QUEUE }; }
  const all = [...queue.pending, ...(queue.committed||[]), ...queue.submitted, ...queue.failed];
  const hashSet = new Set(all.map(i => i.hash));
  const srcSet = new Set(), titSet = new Set();
  for (const i of all) { const sk = sourceKey(i.event||i); if (sk) srcSet.add(sk); const tk = titleKey(i.event||i); if (tk) titSet.add(tk); }
  let added = 0;
  for (const event of events) {
    const h = hashEvent(event);
    if (hashSet.has(h)) continue;
    const sk = sourceKey(event), tk = titleKey(event);
    if (sk && srcSet.has(sk)) continue;
    if (!sk && tk && titSet.has(tk)) continue;
    queue.pending.push({ queueId: crypto.randomUUID(), hash: h, event, enqueuedAt: new Date().toISOString(), retries: 0 });
    hashSet.add(h); if (sk) srcSet.add(sk); if (tk) titSet.add(tk); added++;
  }
  if (added) { await fs.mkdir(path.dirname(QUEUE_FILE), { recursive: true }); await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2)); }
  return added;
}

async function getPending() {
  const [rows] = await getPool().query("SELECT * FROM chain_events WHERE status = 'pending' ORDER BY enqueued_at");
  return rows.map(r => ({ ...r, event: parseEvent(r.event) }));
}

async function markCommitted(queueId, txHash, blockNumber) {
  await getPool().query(
    "UPDATE chain_events SET status = 'committed', tx_hash = ?, block_number = ? WHERE queue_id = ?",
    [txHash, blockNumber, queueId]
  );
}

async function markSubmitted(queueId, txHash, blockNumber) {
  await getPool().query(
    "UPDATE chain_events SET status = 'submitted', tx_hash = ?, block_number = ?, submitted_at = NOW() WHERE queue_id = ?",
    [txHash, blockNumber, queueId]
  );
}

async function markFailed(queueId) {
  const [rows] = await getPool().query("SELECT retries FROM chain_events WHERE queue_id = ?", [queueId]);
  if (!rows.length) return;
  const retries = (rows[0].retries || 0) + 1;
  if (retries >= 3) {
    await getPool().query("UPDATE chain_events SET status = 'failed', retries = ? WHERE queue_id = ?", [retries, queueId]);
  } else {
    await getPool().query("UPDATE chain_events SET retries = ? WHERE queue_id = ?", [retries, queueId]);
  }
}

async function getStats() {
  const [rows] = await getPool().query(
    "SELECT status, COUNT(*) as c FROM chain_events GROUP BY status"
  );
  const stats = { pending: 0, committed: 0, submitted: 0, failed: 0 };
  for (const r of rows) stats[r.status] = r.c;
  return stats;
}

async function getByHash(hash) {
  const [rows] = await getPool().query("SELECT * FROM chain_events WHERE hash = ?", [hash]);
  if (!rows.length) return null;
  return { ...rows[0], event: parseEvent(rows[0].event) };
}

function parseEvent(v) {
  try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; }
}

module.exports = { enqueue, getPending, markCommitted, markSubmitted, markFailed, getStats, getByHash };
