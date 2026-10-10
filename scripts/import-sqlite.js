const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
require('dotenv').config();

const SQLITE_DB = process.argv[2];
if (!SQLITE_DB) {
  console.error('Usage: node import-sqlite.js <path-to-sqlite.db>');
  process.exit(1);
}

function sqliteQuery(db, sql) {
  const out = execSync(`sqlite3 -json "${db}" "${sql.replace(/"/g, '\\"')}"`, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  return JSON.parse(out.trim() || '[]');
}

async function main() {
  const conn = await mysql.createConnection({
    socketPath: '/tmp/mysql.sock',
    user: 'root',
    password: 'abc12345',
    database: 'china-official',
    charset: 'utf8mb4'
  });

  // ===== messages =====
  console.log('Importing telegram_messages...');
  const messages = sqliteQuery(SQLITE_DB, 'SELECT * FROM messages');
  console.log(`  Total: ${messages.length} rows`);
  let msgOk = 0, msgFail = 0;
  for (const m of messages) {
    try {
      await conn.execute(
        'INSERT IGNORE INTO telegram_messages (id, ts, user, text, reply_to) VALUES (?,?,?,?,?)',
        [m.id, m.ts || null, m.user || '', m.text || '', m.reply_to || null]
      );
      msgOk++;
    } catch (e) { msgFail++; if (msgFail === 1) console.error('  Error:', e.message); }
  }
  console.log(`  OK: ${msgOk}, Failed: ${msgFail}`);

  // ===== announcements =====
  console.log('Importing telegram_announcements...');
  const anns = sqliteQuery(SQLITE_DB, 'SELECT * FROM announcements');
  console.log(`  Total: ${anns.length} rows`);
  let annOk = 0, annFail = 0;
  for (const a of anns) {
    try {
      await conn.execute(
        'INSERT IGNORE INTO telegram_announcements (aid, msg_id, ts, region_org, person, action) VALUES (?,?,?,?,?,?)',
        [a.aid, a.msg_id || null, a.ts || null, a.region_org || '', a.person || '', a.action || '']
      );
      annOk++;
    } catch (e) { annFail++; if (annFail === 1) console.error('  Error:', e.message); }
  }
  console.log(`  OK: ${annOk}, Failed: ${annFail}`);

  // ===== predictions =====
  console.log('Importing telegram_predictions...');
  const preds = sqliteQuery(SQLITE_DB, 'SELECT * FROM predictions');
  console.log(`  Total: ${preds.length} rows`);
  let predOk = 0, predFail = 0;
  for (const p of preds) {
    try {
      await conn.execute(
        `INSERT IGNORE INTO telegram_predictions
         (pid, msg_id, ts, speaker, subject, region_org, current_post,
          predicted_outcome, category, timeframe, basis, claim_type, status,
          related_msg_ids, note)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [p.pid, p.msg_id || null, p.ts || null, p.speaker || '', p.subject || '',
         p.region_org || '', p.current_post || '', p.predicted_outcome || '',
         p.category || '', p.timeframe || '', p.basis || '', p.claim_type || '',
         p.status || '', p.related_msg_ids || '', p.note || '']
      );
      predOk++;
    } catch (e) { predFail++; if (predFail === 1) console.error('  Error:', e.message); }
  }
  console.log(`  OK: ${predOk}, Failed: ${predFail}`);

  console.log('\nImport complete!');
  console.log(`  telegram_messages: ${msgOk}`);
  console.log(`  telegram_announcements: ${annOk}`);
  console.log(`  telegram_predictions: ${predOk}`);

  await conn.end();
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
