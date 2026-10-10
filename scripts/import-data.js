const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const DATA_DIR = path.join(__dirname, '..', 'data');

async function main() {
  const pool = mysql.createPool({
    socketPath: process.env.DB_SOCKET || '/tmp/mysql.sock',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'china-official',
    charset: 'utf8mb4',
    multipleStatements: true,
  });

  let total = 0;

  // 1. officials
  try {
    const raw = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'leadership.json'), 'utf8'));
    for (const p of raw) {
      await pool.execute(
        `INSERT IGNORE INTO officials (id,name,age,region,\`system\`,title,attention,promotion,mobility,publicSignal,eventRisk,\`rank\`,path,signals,timeline,events,sources) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [p.id, p.name, p.age||0, p.region||'', p.system||'', p.title||'', p.attention||'低',
         p.promotion||50, p.mobility||50, p.publicSignal||0, p.eventRisk||0, p.rank||'', p.path||'',
         JSON.stringify(p.signals||[]), JSON.stringify(p.timeline||[]), JSON.stringify(p.events||[]), JSON.stringify(p.sources||[])]
      );
    }
    console.log(`[officials] ${raw.length} rows`);
    total += raw.length;
  } catch (e) { console.warn('[officials] skip:', e.message); }

  // 2. huairentang_events
  try {
    const raw = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'huairentang-events.json'), 'utf8'));
    for (const e of raw) {
      const officials = Array.isArray(e.officials) ? e.officials : String(e.officials||'').split(/[,、，;；\s]+/).filter(Boolean);
      const d = e.date ? new Date(e.date).toISOString().slice(0,10) : null;
      await pool.execute(
        `INSERT INTO huairentang_events (id,title,type,impact,summary,officials,date,source,url,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [e.id, e.title||'', e.type||'怀仁堂活动', e.impact||'中', e.summary||'',
         JSON.stringify(officials), d, e.source||'怀仁堂日报', e.url||'', e.createdAt||null]
      );
    }
    console.log(`[huairentang_events] ${raw.length} rows`);
    total += raw.length;
  } catch (e) { console.warn('[huairentang_events] skip:', e.message); }

  // 3. personnel_changes
  try {
    const raw = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'personnel-changes.json'), 'utf8'));
    for (const p of raw) {
      const d = p.date ? p.date.toString().slice(0,10) : null;
      await pool.execute(
        `INSERT INTO personnel_changes (id,person_name,original_position,new_position,status,credibility,date,remarks,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [p.id, p.person_name||'', p.original_position||'', p.new_position||'',
         p.status||'传闻', p.credibility||'中', d, p.remarks||'', p.created_at||null]
      );
    }
    console.log(`[personnel_changes] ${raw.length} rows`);
    total += raw.length;
  } catch (e) { console.warn('[personnel_changes] skip:', e.message); }

  // 4. daily_summary
  try {
    const raw = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'daily-summary.json'), 'utf8'));
    for (const d of raw) {
      await pool.execute(
        `INSERT INTO daily_summary (id,date,main_line,key_discussion,notes,created_at) VALUES (?,?,?,?,?,?,?)`,
        [d.id, d.date||null, d.main_line||'', d.key_discussion||'', d.notes||'', d.created_at||null]
      );
    }
    console.log(`[daily_summary] ${raw.length} rows`);
    total += raw.length;
  } catch (e) { console.warn('[daily_summary] skip:', e.message); }

  // 5. chain_events (from chain-queue.json)
  try {
    const q = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'chain-queue.json'), 'utf8'));
    const all = [...(q.pending||[]), ...(q.committed||[]), ...(q.submitted||[]), ...(q.failed||[])];
    for (const item of all) {
      const status = item.status || (q.pending?.includes(item) ? 'pending' : 'pending');
      await pool.execute(
        `INSERT IGNORE INTO chain_events (queue_id,hash,event,status,enqueued_at,retries) VALUES (?,?,?,?,?,?)`,
        [item.queueId, item.hash, JSON.stringify(item.event||{}), status, item.enqueuedAt||null, item.retries||0]
      );
    }
    console.log(`[chain_events] ${all.length} rows`);
    total += all.length;
  } catch (e) { console.warn('[chain_events] skip:', e.message); }

  // 6. market_results
  try {
    const raw = JSON.parse(await fs.readFile(path.join(DATA_DIR, 'market-results.json'), 'utf8'));
    for (const [pid, val] of Object.entries(raw)) {
      await pool.execute(
        `INSERT INTO market_results (pid,result) VALUES (?,?) ON DUPLICATE KEY UPDATE result=VALUES(result)`,
        [pid, val.result||'']
      );
    }
    console.log(`[market_results] ${Object.keys(raw).length} rows`);
    total += Object.keys(raw).length;
  } catch (e) { console.warn('[market_results] skip:', e.message); }

  console.log(`\nTotal imported: ${total} rows`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
