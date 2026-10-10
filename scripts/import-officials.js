const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  const conn = await mysql.createConnection({
    socketPath: '/tmp/mysql.sock',
    user: 'root',
    password: 'abc12345',
    database: 'china-official',
    charset: 'utf8mb4'
  });

  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'leadership.json'), 'utf8'));
  console.log('officials to import:', raw.length);

  const sql = "INSERT IGNORE INTO officials (id,name,age,region,`system`,title,attention,promotion,mobility,publicSignal,eventRisk,`rank`,path,signals,timeline,events,sources) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

  let ok = 0, fail = 0;
  for (const p of raw) {
    try {
      await conn.execute(sql, [
        p.id, p.name, p.age || 0, p.region || '', p.system || '', p.title || '',
        p.attention || '低', p.promotion || 50, p.mobility || 50,
        p.publicSignal || 0, p.eventRisk || 0, p.rank || '', p.path || '',
        JSON.stringify(p.signals || []), JSON.stringify(p.timeline || []),
        JSON.stringify(p.events || []), JSON.stringify(p.sources || [])
      ]);
      ok++;
    } catch (e) {
      fail++;
      if (fail === 1) console.error('Error:', e.message);
    }
  }

  console.log('officials imported:', ok, 'failed:', fail);
  await conn.end();
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
