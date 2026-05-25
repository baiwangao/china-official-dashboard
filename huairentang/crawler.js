const cheerio = require('cheerio');
const { httpsFetch } = require('../services/httpsFetch');
const eventRadar = require('../services/eventRadarService');
const queueManager = require('../blockchain/queueManager');
const { PRIMARY_QUERIES, SECONDARY_QUERIES, OFFICIAL_RSS_FEEDS, HUAIRENTANG_KEYWORDS } = require('./queries');

const MAX_AGE_DAYS = parseInt(process.env.HUAIRENTANG_NEWS_AGE_DAYS || '7', 10);
const MAX_EVENTS   = parseInt(process.env.HUAIRENTANG_MAX_EVENTS   || '30', 10);

// 怀仁堂专用事件类型分类
function classifyType(title, description = '') {
  const text = `${title} ${description}`;
  if (/表彰|颁奖|颁发|奖励/.test(text))         return '表彰颁奖';
  if (/座谈|研讨|讨论/.test(text))               return '工作座谈';
  if (/会见|接见|会面/.test(text))               return '高层接见';
  if (/全体会议|全国会议|全会|代表大会/.test(text)) return '重要会议';
  return '怀仁堂活动';
}

function isRecent(article) {
  const raw = article.date || article.publishedAt || article.pubDate || '';
  if (!raw) return true; // 无日期则保留
  const d = new Date(raw);
  if (isNaN(d.getTime())) return true;
  const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  return d.getTime() >= cutoff;
}

function containsKeyword(article) {
  const text = `${article.title || ''} ${article.description || ''} ${article.content || ''}`;
  return HUAIRENTANG_KEYWORDS.some(kw => text.includes(kw));
}

function toHuairentangEvent(article) {
  const base = eventRadar.articleToEvent(article, '怀仁堂');
  return {
    ...base,
    type:          classifyType(article.title, article.description || ''),
    category:      'huairentang',
    isHuairentang: true,
  };
}

// 抓取 Google News RSS（复用 eventRadarService 方法）
async function fetchFromGoogleNews() {
  const allArticles = [];
  const queries = [...PRIMARY_QUERIES, ...SECONDARY_QUERIES];
  for (const query of queries) {
    try {
      const articles = await eventRadar.fetchGoogleNewsRSS(query);
      allArticles.push(...articles);
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.warn(`[怀仁堂] Google News RSS "${query}":`, err.message);
    }
  }
  return allArticles;
}

// 直接抓取官媒 RSS 并过滤怀仁堂关键字
async function fetchFromOfficialRSS() {
  const allArticles = [];
  for (const feed of OFFICIAL_RSS_FEEDS) {
    try {
      const response = await httpsFetch(feed.url, {
        headers: {
          'User-Agent': process.env.SCRAPER_USER_AGENT ||
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
      });
      if (!response.ok) continue;
      const xml = await response.text();
      const $ = cheerio.load(xml, { xmlMode: true });
      $('item').each((i, el) => {
        if (i >= 20) return false;
        const title       = $(el).find('title').first().text().trim();
        const link        = $(el).find('link').first().text().trim();
        const pubDate     = $(el).find('pubDate').first().text().trim();
        const description = $(el).find('description').first().text().trim();
        if (title) {
          allArticles.push({
            title, link, url: link,
            date: pubDate, source: feed.name, description,
          });
        }
      });
      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      console.warn(`[怀仁堂] 官媒 RSS "${feed.name}":`, err.message);
    }
  }
  return allArticles;
}

/**
 * 执行一次完整的怀仁堂专项爬取。
 * @returns {{ fetched: number, queued: number, timestamp: string }}
 */
async function crawl() {
  console.log('[怀仁堂] 开始抓取...');
  const [googleArticles, officialArticles] = await Promise.all([
    fetchFromGoogleNews(),
    fetchFromOfficialRSS(),
  ]);

  const combined = [...googleArticles, ...officialArticles];
  const deduped  = eventRadar.dedupeArticles(combined);
  const filtered = deduped.filter(a => containsKeyword(a) && isRecent(a));
  const limited  = filtered.slice(0, MAX_EVENTS);

  const events = limited.map(toHuairentangEvent);
  const queued = events.length > 0 ? await queueManager.enqueue(events) : 0;

  console.log(`[怀仁堂] 抓取完成：找到 ${filtered.length} 篇，入队 ${queued} 条新事件`);
  return {
    fetched:   filtered.length,
    queued,
    timestamp: new Date().toISOString(),
    events,
  };
}

/**
 * 返回已入队（含已上链）的怀仁堂事件列表，供 API 路由查询。
 */
async function getQueuedEvents() {
  const { getPending } = queueManager;
  const pending = await queueManager.getPending();
  return pending
    .filter(item => item.event && item.event.isHuairentang)
    .map(item => ({ ...item.event, hash: item.hash, queueStatus: 'pending' }));
}

module.exports = { crawl, getQueuedEvents };
