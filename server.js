const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const path = require('path');

// Load environment variables
dotenv.config();

// Import modules
const newsApiService = require('./services/newsApiService');
const scraperService = require('./services/scraperService');
const predictorService = require('./services/predictorService');
const dataManager = require('./services/dataManager');
const queueManager = require('./blockchain/queueManager');
const chainWriter = require('./blockchain/chainWriter');
const huairentangCrawler = require('./huairentang/crawler');
const { parseExport } = require('./telegram/parseExport');

const app = express();
const PORT = process.env.PORT || 3000;

function parseMaybeJson(value, fallback = null) {
  if (value == null) return fallback;
  if (Array.isArray(value) || typeof value === 'object') return value;
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeHuairentangEvent(row) {
  const rawOfficials = parseMaybeJson(row.officials, null);
  const officials = Array.isArray(rawOfficials)
    ? rawOfficials
    : String(row.officials || '')
        .split(/[、,，;；\s]+/)
        .map((item) => item.trim())
        .filter(Boolean);
  const title = row.title || row.headline || '';
  const type =
    row.type ||
    (/被查|立案|留置|审查|调查/.test(title) ? '反腐通报' : '怀仁堂日报');
  const impact =
    row.impact ||
    (/严重违纪|违法|立案|留置/.test(title) ? '高' : '中');

  return {
    id: row.id,
    date: row.date || row.event_date || row.created_at || '',
    title,
    summary: row.summary || row.description || row.content || '',
    officials,
    source: row.source || '怀仁堂日报',
    url: row.url || row.link || '',
    type,
    impact,
    createdAt: row.created_at,
  };
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '200mb' }));

// API 鉴权中间件：GET 放行读操作，写操作需要 x-api-key
const API_AUTH_TOKEN = process.env.API_AUTH_TOKEN;
function apiAuth(req, res, next) {
  if (req.method === 'GET') return next();
  if (!API_AUTH_TOKEN) return next(); // 未配置则放行
  const key = req.headers['x-api-key'];
  if (key !== API_AUTH_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}
app.use('/api', apiAuth);

// 静态文件路由：注入 token 到页面
app.get('/', (req, res, next) => {
  const fs = require('fs');
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  res.send(html.replace('</head>', '<meta name="api-auth-token" content="' + (API_AUTH_TOKEN || '') + '">\n</head>'));
});
app.use(express.static(path.join(__dirname, '.')), (req, res, next) => {
  if (req.path === '/' || req.path === '/index.html') return; // handled by route above
  next();
});

// API Routes
app.get('/api/profiles', async (req, res) => {
  try {
    const profiles = await dataManager.getProfiles();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await dataManager.getProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profiles', async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name || !String(body.name).trim()) {
      return res.status(400).json({ error: '姓名不能为空' });
    }
    if (!body.title || !String(body.title).trim()) {
      return res.status(400).json({ error: '现任职务不能为空' });
    }
    const profile = await dataManager.createProfile(body);
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/profiles/:id', async (req, res) => {
  try {
    const profile = await dataManager.updateProfile(req.params.id, req.body);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/profiles/:id', async (req, res) => {
  try {
    await dataManager.deleteProfile(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// News API Routes
app.get('/api/news/search', async (req, res) => {
  try {
    const { query, language = 'en', pageSize = 10 } = req.query;
    const news = await newsApiService.searchNews(query, { language, pageSize });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/news/profile/:name', async (req, res) => {
  try {
    const news = await newsApiService.searchProfileNews(req.params.name);
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scraping Routes
app.post('/api/scrape/media', async (req, res) => {
  try {
    const { sources, query } = req.body;
    const results = await scraperService.scrapeMultipleSources(sources, query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/scrape/sources', async (req, res) => {
  try {
    const sources = await scraperService.getAvailableSources();
    res.json(sources);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Prediction Routes
app.post('/api/predict/profile', async (req, res) => {
  try {
    const prediction = await predictorService.predictProfile(req.body);
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/predict/batch', async (req, res) => {
  try {
    const { profiles } = req.body;
    const predictions = await predictorService.predictBatch(profiles);
    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/predict/update-all', async (req, res) => {
  try {
    const results = await predictorService.updateAllPredictions();
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Event Radar Routes
app.get('/api/events/feed', async (req, res) => {
  try {
    const items = await dataManager.getEventFeed();
    const transitionCount = items.filter((e) => e.type === '任免动向').length;
    res.json({
      total: items.length,
      transitionCount,
      items,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events/scan', async (req, res) => {
  try {
    const { profileId, limit } = req.body || {};
    const results = await dataManager.updateFromNews({ profileId, limit, forceSave: true });
    res.json({ success: true, results, scannedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events/scan/:profileId', async (req, res) => {
  try {
    const scan = await dataManager.scanProfileEvents(req.params.profileId, req.body || {});
    res.json({ success: true, ...scan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Data Update Routes
app.post('/api/update/news', async (req, res) => {
  try {
    const results = await dataManager.updateFromNews();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/update/scrape', async (req, res) => {
  try {
    const results = await dataManager.updateFromScraping();
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Blockchain / Chain Routes
app.get('/api/chain/stats', async (req, res) => {
  try {
    const stats = await queueManager.getStats();
    res.json({ ...stats, configured: chainWriter.isConfigured() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chain/status/:hash', async (req, res) => {
  try {
    const item = await queueManager.getByHash(req.params.hash);
    if (!item) return res.status(404).json({ error: 'Hash not found in queue' });
    const { hash, status, tx_hash, block_number, event, enqueued_at, submitted_at } = item;
    res.json({ hash, status, txHash: tx_hash, blockNumber: block_number,
      event, enqueuedAt: enqueued_at, submittedAt: submitted_at });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chain/submit-now', async (req, res) => {
  try {
    const pending = await queueManager.getPending();
    if (pending.length === 0) return res.json({ message: 'No pending items', submitted: 0 });
    const result = await chainWriter.submitBatch(pending);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chain/settle-market', async (req, res) => {
  try {
    const { settlements, userName } = req.body;
    if (!settlements || !Array.isArray(settlements)) {
      return res.status(400).json({ error: 'Invalid settlements data' });
    }

    // 将结算结果添加到上链队列
    const queueItems = settlements.map(settlement => ({
      type: 'market_settlement',
      data: {
        personName: settlement.personName,
        side: settlement.side,
        amount: settlement.amount,
        result: settlement.result,
        won: settlement.won,
        settledAt: settlement.settledAt,
        userName: userName
      },
      timestamp: new Date().toISOString()
    }));

    // 添加到队列
    for (const item of queueItems) {
      await queueManager.add(item);
    }

    res.json({
      success: true,
      queued: queueItems.length,
      message: `已将 ${queueItems.length} 条结算结果加入上链队列`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chain Stats Routes
app.get('/api/chain/rating/:name', (req, res) => res.json({ message: 'see /api/chain/total-reviews' }));

app.get('/api/chain/total-reviews', async (req, res) => {
  try {
    const total = await chainWriter.getTotalStored();
    res.json({ total, configured: chainWriter.isConfigured() });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Database Tables (from TablePlus, DB不可用时兜底JSON)
app.get('/api/personnel-changes', async (req, res) => {
  try {
    const [rows] = await dataManager.getPool().query('SELECT * FROM personnel_changes ORDER BY date DESC');
    if (rows.length) {
      const fs = require('fs').promises;
      fs.writeFile(path.join(__dirname, 'data/personnel-changes.json'), JSON.stringify(rows, null, 2)).catch(()=>{});
    }
    res.json(rows);
  } catch (error) {
    try {
      const cache = JSON.parse(await require('fs').promises.readFile(path.join(__dirname, 'data/personnel-changes.json'), 'utf8'));
      return res.json(cache);
    } catch { res.status(500).json({ error: error.message }); }
  }
});

app.get('/api/daily-summary', async (req, res) => {
  try {
    const [rows] = await dataManager.getPool().query('SELECT * FROM daily_summary ORDER BY date DESC');
    if (rows.length) {
      const fs = require('fs').promises;
      fs.writeFile(path.join(__dirname, 'data/daily-summary.json'), JSON.stringify(rows, null, 2)).catch(()=>{});
    }
    res.json(rows);
  } catch (error) {
    try {
      const cache = JSON.parse(await require('fs').promises.readFile(path.join(__dirname, 'data/daily-summary.json'), 'utf8'));
      return res.json(cache);
    } catch { res.status(500).json({ error: error.message }); }
  }
});

app.get('/api/huairentang/events', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const [rows] = await dataManager
      .getPool()
      .query('SELECT * FROM huairentang_events ORDER BY date DESC, id DESC LIMIT ?', [limit]);
    const events = rows.map(normalizeHuairentangEvent);
    if (events.length) {
      const fs = require('fs').promises;
      fs.writeFile(path.join(__dirname, 'data/huairentang-events.json'), JSON.stringify(events, null, 2)).catch(()=>{});
    }
    res.json(events);
  } catch (error) {
    try {
      const cache = JSON.parse(await require('fs').promises.readFile(path.join(__dirname, 'data/huairentang-events.json'), 'utf8'));
      return res.json(cache.map(normalizeHuairentangEvent));
    } catch { res.status(500).json({ error: error.message }); }
  }
});

app.post('/api/huairentang/crawl', async (req, res) => {
  try {
    const result = await huairentangCrawler.crawl();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Telegram 聊天记录导入（POST body 为 result.json 的内容）
app.post('/api/telegram/import', express.json({ limit: "200mb" }), async (req, res) => {
  try {
    const exportData = req.body;
    if (!exportData || !Array.isArray(exportData.messages)) {
      return res.status(400).json({ error: '请上传 Telegram 导出的 result.json 内容（需包含 messages 字段）' });
    }
    const messages = parseExport(exportData);
    const queued   = await queueManager.enqueue(messages);
    const stats    = await queueManager.getStats();
    res.json({
      success:  true,
      parsed:   messages.length,
      queued,
      stats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Scheduled tasks
// Run news update every 6 hours
cron.schedule('0 */6 * * *', async () => {
  console.log('Running scheduled news update...');
  try {
    await dataManager.updateFromNews();
  } catch (error) {
    console.error('Scheduled news update failed:', error);
  }
});

// Run scraping every 12 hours
cron.schedule('0 */12 * * *', async () => {
  console.log('Running scheduled scraping...');
  try {
    await dataManager.updateFromScraping();
  } catch (error) {
    console.error('Scheduled scraping failed:', error);
  }
});

// 怀仁堂专项爬虫 — 每4小时
cron.schedule('0 */4 * * *', async () => {
  console.log('[Cron] 怀仁堂专项爬取...');
  try {
    await huairentangCrawler.crawl();
  } catch (error) {
    console.error('[Cron] 怀仁堂爬取失败:', error);
  }
});

// 每日凌晨2点批量上链
cron.schedule('0 2 * * *', async () => {
  console.log('[Cron] 开始批量上链...');
  try {
    const pending = await queueManager.getPending();
    if (pending.length > 0) {
      const result = await chainWriter.submitBatch(pending);
      console.log(`[Cron] 上链完成: 成功 ${result.submitted}, 失败 ${result.failed}`);
    } else {
      console.log('[Cron] 无待上链事件');
    }
  } catch (error) {
    console.error('[Cron] 上链失败:', error);
  }
});

// ===== 预测市场交易记录 =====
app.post('/api/market/trade', async (req, res) => {
  try {
    const { marketId, personName, side, amount } = req.body;
    if (!marketId || !personName || !side || !amount) return res.status(400).json({ error: '参数不完整' });
    await dataManager.getPool().execute(
      'INSERT INTO market_trades (market_id, person_name, side, amount) VALUES (?, ?, ?, ?)',
      [marketId, personName, side, amount]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/kline/sentiment/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const [rows] = await dataManager.getPool().execute(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
             SUM(CASE WHEN side = 'yes' THEN amount ELSE 0 END) AS yes_total,
             SUM(CASE WHEN side = 'no' THEN amount ELSE 0 END) AS no_total,
             COUNT(*) AS trade_count
      FROM market_trades WHERE YEAR(created_at) = ?
      GROUP BY month ORDER BY month
    `, [year]);
    res.json({ year, data: rows.map(r => ({ month: r.month, yes: Number(r.yes_total), no: Number(r.no_total), count: Number(r.trade_count) })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== 中纪委 K线监控 API =====
const GRADE_CASE = `
  CASE grade
    WHEN '正国级' THEN 10 WHEN '副国级' THEN 9
    WHEN '正部级' THEN 8  WHEN '副部级' THEN 7
    WHEN '正厅级' THEN 6  WHEN '副厅级' THEN 5
    WHEN '正处级' THEN 4  WHEN '副处级' THEN 3
    WHEN '科级'   THEN 2  ELSE 1
  END`;

app.get('/api/kline/years', async (_req, res) => {
  try {
    const [rows] = await dataManager.getPool().execute(
      'SELECT YEAR(date) AS year, COUNT(*) AS total FROM huairentang_events WHERE date IS NOT NULL GROUP BY year ORDER BY year DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/kline/stats', async (_req, res) => {
  try {
    const [[t]] = await dataManager.getPool().execute('SELECT COUNT(*) AS cnt FROM huairentang_events');
    const [[pm]] = await dataManager.getPool().execute("SELECT DATE_FORMAT(date,'%Y-%m') AS month, COUNT(*) AS cnt FROM huairentang_events GROUP BY month ORDER BY cnt DESC LIMIT 1");
    const [[tg]] = await dataManager.getPool().execute("SELECT type FROM huairentang_events WHERE impact='高' GROUP BY type ORDER BY COUNT(*) DESC LIMIT 1");
    const [bg] = await dataManager.getPool().execute('SELECT type AS grade, COUNT(*) AS cnt FROM huairentang_events GROUP BY type ORDER BY cnt DESC');
    res.json({ total: Number(t.cnt), topGrade: tg?.type || '—', peakMonth: pm?.month || '—', peakCount: Number(pm?.cnt || 0), byGrade: bg.map(g => ({ grade: g.grade, cnt: Number(g.cnt) })) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/kline/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json([]);
  try {
    const [rows] = await dataManager.getPool().execute(
      'SELECT id, title, type, impact, summary, date FROM huairentang_events WHERE title LIKE ? ORDER BY date DESC LIMIT 30',
      [`%${q}%`]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/kline/:year', async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    if (isNaN(year) || year < 2012 || year > 2030) return res.status(400).json({ error: '年份参数无效' });

    await dataManager.getPool().execute('SET SESSION group_concat_max_len = 65536');
    const [rows] = await dataManager.getPool().execute(`
      SELECT DATE_FORMAT(date, '%Y-%m') AS month,
             COUNT(*) AS count,
             SUM(CASE WHEN impact = '高' THEN 10 WHEN impact = '中' THEN 6 ELSE 3 END) AS severity,
             COUNT(CASE WHEN type = '反腐通报' THEN 1 END) AS anti_corruption,
             COUNT(CASE WHEN type = '重大事故' THEN 1 END) AS major_accident,
             COUNT(CASE WHEN type = '人事动向' THEN 1 END) AS personnel_move,
             GROUP_CONCAT(CONCAT(IFNULL(title,''), '|||', IFNULL(type,''), '|||', IFNULL(impact,''), '|||', IFNULL(summary,'')) ORDER BY date DESC SEPARATOR '~~~') AS events_raw
      FROM huairentang_events
      WHERE YEAR(date) = ?
      GROUP BY month ORDER BY month
    `, [year]);

    if (!rows.length) return res.json({ year, data: [] });

    const months = rows.map(r => ({
      month: r.month,
      count: Number(r.count),
      severity: Number(r.severity),
      anti_corruption: Number(r.anti_corruption),
      major_accident: Number(r.major_accident),
      personnel_move: Number(r.personnel_move),
      events: (r.events_raw || '').split('~~~').filter(Boolean).map(s => {
        const p = s.split('|||');
        return { title: p[0] || '', type: p[1] || '', impact: p[2] || '', summary: p[3] || '' };
      }),
    }));

    const klineData = months.map((m, i) => {
      const open = i === 0 ? m.severity : months[i - 1].severity;
      const close = m.severity;
      const body = Math.abs(close - open);
      const low  = Math.max(0, Math.min(open, close) - Math.max(1, Math.floor(body * 0.3)));
      const high = Math.max(open, close) + Math.max(1, Math.floor(body * 0.4));
      return { ...m, open, close, low, high };
    });

    res.json({ year, data: klineData });
  } catch (err) { res.status(500).json({ error: '查询失败', detail: err.message }); }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
