const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const newsApiService = require('./newsApiService');
const scraperService = require('./scraperService');
const predictorService = require('./predictorService');
const eventRadarService = require('./eventRadarService');

class DataManager {
  constructor() {
    this.pool = null;
    this.dataDir = path.join(__dirname, '../data');
    this.profilesFile = path.join(this.dataDir, 'leadership.json');
    this.dbAvailable = null;
  }

  async tryDB(fn) {
    try {
      if (this.dbAvailable === false) throw new Error('db-offline');
      this.getPool(); // ensure pool exists
      const result = await fn();
      this.dbAvailable = true;
      return result;
    } catch (e) {
      this.dbAvailable = false;
      console.warn('[DataManager] DB异常，使用本地JSON:', e.message.substring(0, 50));
      return null;
    }
  }

  getPool() {
    if (!this.pool) {
      this.pool = mysql.createPool({
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
    return this.pool;
  }

  // ===== Officials (DB优先，JSON兜底) =====
  async getProfiles() {
    const dbResult = await this.tryDB(async () => {
      const [rows] = await this.getPool().query('SELECT * FROM officials ORDER BY created_at DESC');
      return rows.map(r => this.rowToProfile(r));
    });
    if (dbResult) return dbResult;

    // 回退 JSON
    try {
      const data = await fs.readFile(this.profilesFile, 'utf8');
      return JSON.parse(data);
    } catch { return []; }
  }

  async getProfileById(id) {
    const [rows] = await this.getPool().query('SELECT * FROM officials WHERE id = ?', [id]);
    return rows.length ? this.rowToProfile(rows[0]) : null;
  }

  async createProfile(profile) {
    if (!profile.name || !String(profile.name).trim()) {
      throw new Error('姓名不能为空');
    }

    if (!profile.id) {
      const slug = String(profile.name).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\u4e00-\u9fff-]/g, '');
      profile.id = `manual-${slug || 'profile'}-${Date.now()}`;
    }

    const [rows] = await this.getPool().query('SELECT id FROM officials WHERE id = ?', [profile.id]);
    if (rows.length > 0) {
      profile.id = `${profile.id}-${Math.random().toString(36).slice(2, 6)}`;
    }

    await this.getPool().query(
      `INSERT INTO officials (id, name, age, region, \`system\`, title, attention, promotion, mobility, publicSignal, eventRisk, \`rank\`, path, signals, timeline, events, sources)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [profile.id, profile.name, profile.age||0, profile.region||'', profile.system||'', profile.title||'',
       profile.attention||'低', profile.promotion||50, profile.mobility||50, profile.publicSignal||0,
       profile.eventRisk||0, profile.rank||'', profile.path||'',
       JSON.stringify(profile.signals||[]), JSON.stringify(profile.timeline||[]),
       JSON.stringify(profile.events||[]), JSON.stringify(profile.sources||[])]
    );

    return this.getProfileById(profile.id);
  }

  async updateProfile(id, updates) {
    const existing = await this.getProfileById(id);
    if (!existing) throw new Error('Profile not found');

    const merged = { ...existing, ...updates, id };
    await this.getPool().query(
      `UPDATE officials SET name=?, age=?, region=?, \`system\`=?, title=?, attention=?, promotion=?, mobility=?, publicSignal=?, eventRisk=?, \`rank\`=?, path=?, signals=?, timeline=?, events=?, sources=?, updated_at=NOW()
       WHERE id=?`,
      [merged.name, merged.age||0, merged.region||'', merged.system||'', merged.title||'',
       merged.attention||'低', merged.promotion||50, merged.mobility||50, merged.publicSignal||0,
       merged.eventRisk||0, merged.rank||'', merged.path||'',
       JSON.stringify(merged.signals||[]), JSON.stringify(merged.timeline||[]),
       JSON.stringify(merged.events||[]), JSON.stringify(merged.sources||[]), id]
    );

    return this.getProfileById(id);
  }

  async deleteProfile(id) {
    await this.getPool().query('DELETE FROM officials WHERE id = ?', [id]);
  }

  rowToProfile(r) {
    const parse = (v) => { try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; } };
    return {
      id: r.id, name: r.name, age: r.age, region: r.region, system: r.system,
      title: r.title, attention: r.attention, promotion: r.promotion, mobility: r.mobility,
      publicSignal: r.publicSignal, eventRisk: r.eventRisk, rank: r.rank, path: r.path,
      signals: parse(r.signals) || [],
      timeline: parse(r.timeline) || [],
      events: parse(r.events) || [],
      sources: parse(r.sources) || [],
      createdAt: r.created_at, updatedAt: r.updated_at
    };
  }

  // ===== Predictions =====
  async savePredictions(predictions) {
    // Predictions 保留为 JSON 缓存，轻量无需建表
    const fs = require('fs').promises;
    const path = require('path');
    const file = path.join(__dirname, '../data/predictions.json');
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(predictions, null, 2));
  }

  async getPredictions() {
    const fs = require('fs').promises;
    const path = require('path');
    try {
      const data = await fs.readFile(path.join(__dirname, '../data/predictions.json'), 'utf8');
      return JSON.parse(data);
    } catch { return []; }
  }

  async getPredictionByProfileId(profileId) {
    const preds = await this.getPredictions();
    return preds.find(p => p.profileId === profileId);
  }

  // ===== News Cache =====
  async cacheNews(newsData) {
    const fs = require('fs').promises;
    const path = require('path');
    await fs.writeFile(path.join(__dirname, '../data/news-cache.json'), JSON.stringify(newsData, null, 2));
  }

  async getNewsCache() {
    const fs = require('fs').promises;
    const path = require('path');
    try { return JSON.parse(await fs.readFile(path.join(__dirname, '../data/news-cache.json'), 'utf8')); }
    catch { return { timestamp: null, data: [] }; }
  }

  // ===== Event Radar =====
  async updateFromNews(options = {}) {
    console.log('[EventRadar] Scanning...');
    const profiles = await this.getProfiles();
    const scanResults = await eventRadarService.scanProfiles(profiles, options);
    const results = [];

    for (const scan of scanResults) {
      if (!scan.success) { results.push(scan); continue; }
      if (scan.eventsAdded > 0 || options.forceSave) {
        await this.updateProfile(scan.profileId, { events: scan.events, eventRisk: scan.eventRisk });
        if (scan.newEvents && scan.newEvents.length > 0) {
          try {
            const queueManager = require('../blockchain/queueManager');
            await queueManager.enqueue(scan.newEvents);
          } catch (err) { console.warn('[DataManager] enqueue fail:', err.message); }
        }
      }
      results.push({ profileId: scan.profileId, name: scan.name, articlesFound: scan.articlesFound,
        eventsAdded: scan.eventsAdded, totalEvents: scan.events?.length||0, eventRisk: scan.eventRisk,
        newEvents: scan.newEvents, success: true });
    }
    return results;
  }

  async scanProfileEvents(profileId, options = {}) {
    const profile = await this.getProfileById(profileId);
    if (!profile) throw new Error('Profile not found');
    const scan = await eventRadarService.scanProfile(profile, options);
    await this.updateProfile(profileId, { events: scan.events, eventRisk: scan.eventRisk });
    if (scan.newEvents && scan.newEvents.length > 0) {
      try {
        const queueManager = require('../blockchain/queueManager');
        await queueManager.enqueue(scan.newEvents);
      } catch (err) { console.warn('[DataManager] enqueue fail:', err.message); }
    }
    return scan;
  }

  async getEventFeed() {
    const profiles = await this.getProfiles();
    return eventRadarService.buildFeed(profiles);
  }

  async updateFromScraping() {
    const profiles = await this.getProfiles();
    const toScrape = profiles.slice(0, 5);
    const results = [];
    for (const profile of toScrape) {
      try {
        const scraped = await scraperService.scrapeProfileNews(profile.name);
        for (const sourceData of scraped) {
          if (sourceData.articles && sourceData.articles.length > 0) {
            const newEvents = sourceData.articles.slice(0, 2).map(a => ({
              type: '海外媒体', title: a.title, date: a.date || new Date().toISOString().split('T')[0],
              impact: '中', confidence: '未交叉验证', relation: `来源: ${sourceData.source}`, url: a.link
            }));
            if (newEvents.length > 0) {
              await this.updateProfile(profile.id, { events: [...(profile.events||[]), ...newEvents] });
              results.push({ profileId: profile.id, name: profile.name, source: sourceData.source,
                articlesFound: sourceData.articles.length, eventsAdded: newEvents.length });
            }
          }
        }
        await new Promise(r => setTimeout(r, 2000));
      } catch (error) { results.push({ profileId: profile.id, name: profile.name, error: error.message }); }
    }
    return results;
  }

  async enrichProfileWithRealData(profile) {
    const enrichment = { news: [], scraped: [], prediction: null };
    try {
      const news = await newsApiService.searchProfileNews(profile.name);
      enrichment.news = news.articles || [];
      const scraped = await scraperService.scrapeProfileNews(profile.name);
      enrichment.scraped = scraped;
      enrichment.prediction = await predictorService.predictProfile(profile);
      return enrichment;
    } catch (error) { throw error; }
  }

  async exportData(format = 'json') {
    const profiles = await this.getProfiles();
    const predictions = await this.getPredictions();
    return JSON.stringify({
      timestamp: new Date().toISOString(), profiles, predictions,
      summary: { totalProfiles: profiles.length, totalPredictions: predictions.length,
        highAttention: profiles.filter(p => p.attention==='高').length,
        highRisk: profiles.filter(p => p.eventRisk>=70).length }
    }, null, 2);
  }
}

module.exports = new DataManager();
