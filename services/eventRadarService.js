const cheerio = require('cheerio');
const { httpsFetch } = require('./httpsFetch');
const newsApiService = require('./newsApiService');
const scraperService = require('./scraperService');

const TRANSITION_RE = /任免|任命|调任|辞职|履新|当选|兼任|免职|提拔|出任|接替|挂职|晋升|履任|appointed|appointment|resign|promoted|named|succeeds/i;

class EventRadarService {
  constructor() {
    this.scanDelayMs = Number(process.env.EVENT_RADAR_DELAY_MS) || 1200;
    this.batchLimit = Number(process.env.EVENT_RADAR_BATCH_LIMIT) || 15;
  }

  parseDate(raw) {
    if (!raw) return new Date().toISOString().split('T')[0];
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
    const m = String(raw).match(/(\d{4})[-/年](\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}`;
    return new Date().toISOString().split('T')[0];
  }

  eventKey(event) {
    return (event.url || event.title || '').toLowerCase().trim();
  }

  dedupeArticles(articles) {
    const seen = new Set();
    return articles.filter((a) => {
      const key = (a.url || a.link || a.title || '').toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  isRelevant(article, profileName) {
    const text = `${article.title || ''} ${article.description || ''} ${article.content || ''}`;
    return text.includes(profileName);
  }

  classifyEventType(title, description = '') {
    const text = `${title} ${description}`;
    if (/反腐|立案|调查|违纪|贪污|受贿/.test(text)) return '反腐通报';
    if (/事故|爆炸|火灾|坍塌/.test(text)) return '重大事故';
    if (TRANSITION_RE.test(text)) return '任免动向';
    if (/会见|访问|外交|出访|峰会/.test(text)) return '外事活动';
    if (/表彰|奖励|先进/.test(text)) return '表彰奖励';
    return '媒体报道';
  }

  estimateImpact(article) {
    const text = `${article.title || ''} ${article.description || ''}`;
    if (/反腐|立案|调查|违纪|事故|爆炸|辞职|免职|resign|investigation/i.test(text)) return '高';
    if (TRANSITION_RE.test(text)) return '中';
    return '低';
  }

  estimateConfidence(article) {
    const src = `${article.source || ''} ${article.title || ''}`;
    if (/新华社|人民网|央视|中国政府网|国务院|xinhua|people\.com/i.test(src)) return '官方发布';
    if (/路透|BBC|Reuters|AP|彭博|华尔街日报/i.test(src)) return '国际主流媒';
    return '单源公开报道';
  }

  articleToEvent(article, profileName) {
    const desc = article.description || article.content || '';
    return {
      type: this.classifyEventType(article.title, desc),
      title: article.title,
      date: this.parseDate(article.publishedAt || article.date || article.pubDate),
      impact: this.estimateImpact(article),
      confidence: this.estimateConfidence(article),
      relation: `事件雷达抓取 · 与 ${profileName} 相关的公开报道`,
      url: article.url || article.link,
      source: article.source || '未知来源',
      fetchedAt: new Date().toISOString(),
    };
  }

  calcEventRisk(events = []) {
    if (!events.length) return 0;
    let score = 0;
    for (const e of events) {
      if (e.impact === '高') score += 22;
      else if (e.impact === '中') score += 10;
      else score += 4;
    }
    return Math.min(100, score);
  }

  mergeEvents(existing = [], incoming = []) {
    const keys = new Set(existing.map((e) => this.eventKey(e)));
    const merged = [...existing];
    for (const e of incoming) {
      const key = this.eventKey(e);
      if (!key || keys.has(key)) continue;
      merged.push(e);
      keys.add(key);
    }
    return merged.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }

  async fetchGoogleNewsRSS(query) {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=zh-CN&gl=CN&ceid=CN:zh-Hans`;
    const response = await httpsFetch(url, {
      headers: {
        'User-Agent':
          process.env.SCRAPER_USER_AGENT ||
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml',
      },
    });

    if (!response.ok) {
      throw new Error(`Google News RSS HTTP ${response.status}`);
    }

    const xml = await response.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const articles = [];

    $('item').each((index, element) => {
      if (index >= 12) return false;
      const title = $(element).find('title').first().text().trim();
      const link = $(element).find('link').first().text().trim();
      const pubDate = $(element).find('pubDate').first().text().trim();
      const source = $(element).find('source').first().text().trim();
      const description = $(element).find('description').first().text().trim();
      if (title) {
        articles.push({ title, link, url: link, date: pubDate, source: source || 'Google News', description });
      }
    });

    return articles;
  }

  buildSearchQueries(profile) {
    const name = profile.name;
    return [
      `${name} 任免`,
      `${name} 任命`,
      `${name} 调任 辞职`,
      `${name} 职务`,
      `${name} China official`,
    ];
  }

  async fetchArticlesForProfile(profile) {
    const queries = this.buildSearchQueries(profile);
    const buckets = [];

    for (const query of queries.slice(0, 3)) {
      try {
        const articles = await this.fetchGoogleNewsRSS(query);
        buckets.push(...articles);
        await new Promise((r) => setTimeout(r, 400));
      } catch (err) {
        console.warn(`[EventRadar] RSS "${query}":`, err.message);
      }
    }

    if (process.env.NEWS_API_KEY) {
      try {
        const news = await newsApiService.searchProfileNews(profile.name);
        const list = news.articles || (Array.isArray(news) ? news : []);
        buckets.push(
          ...list.map((a) => ({
            title: a.title,
            url: a.url,
            link: a.url,
            description: a.description,
            publishedAt: a.publishedAt,
            source: a.source,
          })),
        );
      } catch (err) {
        console.warn(`[EventRadar] NewsAPI ${profile.name}:`, err.message);
      }
    }

    try {
      const scraped = await scraperService.scrapeProfileNews(`${profile.name} China`);
      for (const block of scraped) {
        if (block.articles?.length) {
          buckets.push(
            ...block.articles.map((a) => ({
              title: a.title,
              link: a.link,
              url: a.link,
              date: a.date,
              description: a.content,
              source: block.source || a.source,
            })),
          );
        }
      }
    } catch (err) {
      console.warn(`[EventRadar] Scrape ${profile.name}:`, err.message);
    }

    const relevant = this.dedupeArticles(buckets).filter((a) => this.isRelevant(a, profile.name));

    const transitionFirst = relevant.sort((a, b) => {
      const aT = TRANSITION_RE.test(`${a.title} ${a.description || ''}`) ? 1 : 0;
      const bT = TRANSITION_RE.test(`${b.title} ${b.description || ''}`) ? 1 : 0;
      return bT - aT;
    });

    return transitionFirst;
  }

  async scanProfile(profile, options = {}) {
    const limit = options.limit || 8;
    const articles = await this.fetchArticlesForProfile(profile);
    const newEvents = articles.slice(0, limit).map((a) => this.articleToEvent(a, profile.name));
    const mergedEvents = this.mergeEvents(profile.events || [], newEvents);
    const eventRisk = this.calcEventRisk(mergedEvents);

    return {
      profileId: profile.id,
      name: profile.name,
      articlesFound: articles.length,
      eventsAdded: newEvents.filter((e) => !(profile.events || []).some((x) => this.eventKey(x) === this.eventKey(e))).length,
      events: mergedEvents,
      eventRisk,
      newEvents,
    };
  }

  async scanProfiles(profiles, options = {}) {
    const limit = Math.min(options.limit || this.batchLimit, profiles.length);
    const targets = options.profileId
      ? profiles.filter((p) => p.id === options.profileId).slice(0, 1)
      : profiles.slice(0, limit);

    const results = [];
    for (const profile of targets) {
      try {
        const result = await this.scanProfile(profile, options);
        results.push({ ...result, success: true });
      } catch (err) {
        results.push({
          profileId: profile.id,
          name: profile.name,
          success: false,
          error: err.message,
          eventsAdded: 0,
        });
      }
      await new Promise((r) => setTimeout(r, this.scanDelayMs));
    }
    return results;
  }

  buildFeed(profiles) {
    const items = [];
    for (const profile of profiles) {
      for (const event of profile.events || []) {
        items.push({
          profileId: profile.id,
          profileName: profile.name,
          profileTitle: profile.title,
          region: profile.region,
          ...event,
        });
      }
    }
    return items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }
}

module.exports = new EventRadarService();
