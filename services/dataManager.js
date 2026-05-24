const fs = require('fs').promises;
const path = require('path');
const newsApiService = require('./newsApiService');
const scraperService = require('./scraperService');
const predictorService = require('./predictorService');
const eventRadarService = require('./eventRadarService');

class DataManager {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.profilesFile = path.join(this.dataDir, 'leadership.json');
    this.predictionsFile = path.join(this.dataDir, 'predictions.json');
    this.newsCacheFile = path.join(this.dataDir, 'news-cache.json');
  }

  async ensureDataDir() {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  async getProfiles() {
    await this.ensureDataDir();
    
    try {
      const data = await fs.readFile(this.profilesFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log('No profiles file found, returning empty array');
      return [];
    }
  }

  async getProfileById(id) {
    const profiles = await this.getProfiles();
    return profiles.find(profile => profile.id === id);
  }

  async createProfile(profile) {
    await this.ensureDataDir();
    const profiles = await this.getProfiles();

    if (!profile.name || !String(profile.name).trim()) {
      throw new Error('姓名不能为空');
    }

    if (!profile.id) {
      const slug = String(profile.name)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\u4e00-\u9fff-]/g, '');
      profile.id = `manual-${slug || 'profile'}-${Date.now()}`;
    }

    if (profiles.some((p) => p.id === profile.id)) {
      profile.id = `${profile.id}-${Math.random().toString(36).slice(2, 6)}`;
    }

    profile.custom = true;
    profile.createdAt = profile.createdAt || new Date().toISOString();

    profiles.push(profile);
    await fs.writeFile(this.profilesFile, JSON.stringify(profiles, null, 2));

    return profile;
  }

  async updateProfile(id, updates) {
    const profiles = await this.getProfiles();
    const index = profiles.findIndex(profile => profile.id === id);
    
    if (index === -1) {
      throw new Error('Profile not found');
    }

    profiles[index] = { ...profiles[index], ...updates };
    await fs.writeFile(this.profilesFile, JSON.stringify(profiles, null, 2));
    
    return profiles[index];
  }

  async deleteProfile(id) {
    const profiles = await this.getProfiles();
    const filtered = profiles.filter(profile => profile.id !== id);
    await fs.writeFile(this.profilesFile, JSON.stringify(filtered, null, 2));
  }

  async savePredictions(predictions) {
    await this.ensureDataDir();
    await fs.writeFile(this.predictionsFile, JSON.stringify(predictions, null, 2));
  }

  async getPredictions() {
    await this.ensureDataDir();
    
    try {
      const data = await fs.readFile(this.predictionsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  async getPredictionByProfileId(profileId) {
    const predictions = await this.getPredictions();
    return predictions.find(pred => pred.profileId === profileId);
  }

  async cacheNews(newsData) {
    await this.ensureDataDir();
    const cache = await this.getNewsCache();
    const newCache = {
      ...cache,
      timestamp: new Date().toISOString(),
      data: newsData
    };
    await fs.writeFile(this.newsCacheFile, JSON.stringify(newCache, null, 2));
  }

  async getNewsCache() {
    await this.ensureDataDir();
    
    try {
      const data = await fs.readFile(this.newsCacheFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return { timestamp: null, data: [] };
    }
  }

  async updateFromNews(options = {}) {
    console.log('[EventRadar] Scanning profiles for transition news...');
    const profiles = await this.getProfiles();
    const scanResults = await eventRadarService.scanProfiles(profiles, options);
    const results = [];

    for (const scan of scanResults) {
      if (!scan.success) {
        results.push(scan);
        continue;
      }
      if (scan.eventsAdded > 0 || options.forceSave) {
        await this.updateProfile(scan.profileId, {
          events: scan.events,
          eventRisk: scan.eventRisk,
        });
      }
      results.push({
        profileId: scan.profileId,
        name: scan.name,
        articlesFound: scan.articlesFound,
        eventsAdded: scan.eventsAdded,
        totalEvents: scan.events?.length || 0,
        eventRisk: scan.eventRisk,
        events: scan.events,
        newEvents: scan.newEvents,
        success: true,
      });
    }

    await this.cacheNews(results);
    return results;
  }

  async scanProfileEvents(profileId, options = {}) {
    const profile = await this.getProfileById(profileId);
    if (!profile) throw new Error('Profile not found');

    const scan = await eventRadarService.scanProfile(profile, options);
    await this.updateProfile(profileId, {
      events: scan.events,
      eventRisk: scan.eventRisk,
    });

    return scan;
  }

  async getEventFeed() {
    const profiles = await this.getProfiles();
    return eventRadarService.buildFeed(profiles);
  }

  async updateFromScraping() {
    console.log('Updating profiles from web scraping...');
    const profiles = await this.getProfiles();
    const results = [];

    // Limit scraping to avoid being blocked
    const profilesToScrape = profiles.slice(0, 5); // Only scrape first 5 profiles
    
    for (const profile of profilesToScrape) {
      try {
        const scrapedData = await scraperService.scrapeProfileNews(profile.name);
        
        for (const sourceData of scrapedData) {
          if (sourceData.articles && sourceData.articles.length > 0) {
            const newEvents = sourceData.articles
              .slice(0, 2)
              .map(article => ({
                type: '海外媒体',
                title: article.title,
                date: article.date || new Date().toISOString().split('T')[0],
                impact: '中',
                confidence: '未交叉验证',
                relation: `来源: ${sourceData.source}`,
                url: article.link
              }));

            if (newEvents.length > 0) {
              await this.updateProfile(profile.id, {
                events: [...(profile.events || []), ...newEvents]
              });
              
              results.push({
                profileId: profile.id,
                name: profile.name,
                source: sourceData.source,
                articlesFound: sourceData.articles.length,
                eventsAdded: newEvents.length
              });
            }
          }
        }

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error scraping for profile ${profile.name}:`, error.message);
        results.push({
          profileId: profile.id,
          name: profile.name,
          error: error.message
        });
      }
    }

    return results;
  }

  async enrichProfileWithRealData(profile) {
    // Combine news API and scraping to enrich a single profile
    const enrichment = {
      news: [],
      scraped: [],
      prediction: null
    };

    try {
      // Get news from API
      const news = await newsApiService.searchProfileNews(profile.name);
      enrichment.news = news.articles || [];

      // Get scraped data
      const scraped = await scraperService.scrapeProfileNews(profile.name);
      enrichment.scraped = scraped;

      // Generate prediction
      enrichment.prediction = await predictorService.predictProfile(profile);

      return enrichment;
    } catch (error) {
      console.error('Error enriching profile:', error.message);
      throw error;
    }
  }

  async exportData(format = 'json') {
    const profiles = await this.getProfiles();
    const predictions = await this.getPredictions();

    const exportData = {
      timestamp: new Date().toISOString(),
      profiles,
      predictions,
      summary: {
        totalProfiles: profiles.length,
        totalPredictions: predictions.length,
        highAttention: profiles.filter(p => p.attention === '高').length,
        highRisk: profiles.filter(p => p.eventRisk >= 70).length
      }
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    }

    throw new Error(`Unsupported export format: ${format}`);
  }
}

module.exports = new DataManager();
