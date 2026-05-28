const { httpsFetch } = require('./httpsFetch');

class NewsApiService {
  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY;
    this.baseUrl = 'https://newsapi.org/v2';
  }

  async searchNews(query, options = {}) {
    const { language = 'en', pageSize = 10, page = 1, sortBy = 'publishedAt' } = options;
    
    if (!this.newsApiKey) {
      throw new Error('NEWS_API_KEY not configured');
    }

    try {
      const params = new URLSearchParams({
        q: query,
        language,
        pageSize: String(pageSize),
        page: String(page),
        sortBy,
        apiKey: this.newsApiKey,
      });
      const response = await httpsFetch(`${this.baseUrl}/everything?${params}`);
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText.slice(0, 120)}`);
      }
      const data = await response.json();
      return this.formatNewsResponse(data);
    } catch (error) {
      console.error('NewsAPI error:', error.message);
      throw new Error(`NewsAPI request failed: ${error.message}`);
    }
  }

  async searchProfileNews(profileName) {
    const queries = [
      `${profileName} 任免`,
      `${profileName} 任命`,
      profileName,
      `${profileName} China official`,
    ];

    const results = await Promise.allSettled(
      queries.map(query => this.searchNews(query, { pageSize: 5 }))
    );

    const allArticles = results
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value.articles);

    return this.deduplicateArticles(allArticles);
  }

  async getTopHeadlines(category = 'general', country = 'us') {
    if (!this.newsApiKey) throw new Error('NEWS_API_KEY not configured');
    const params = new URLSearchParams({ category, country, apiKey: this.newsApiKey });
    const response = await httpsFetch(`${this.baseUrl}/top-headlines?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return this.formatNewsResponse(await response.json());
  }

  async searchChinaNews() {
    // Search for China-related news from international sources
    const queries = [
      'China government',
      'Chinese official',
      'China politics',
      'China leadership'
    ];

    const results = await Promise.allSettled(
      queries.map(query => this.searchNews(query, { pageSize: 10 }))
    );

    const allArticles = results
      .filter(result => result.status === 'fulfilled')
      .flatMap(result => result.value.articles);

    return this.deduplicateArticles(allArticles);
  }

  formatNewsResponse(data) {
    return {
      status: data.status,
      totalResults: data.totalResults,
      articles: data.articles.map(article => ({
        source: article.source.name,
        author: article.author,
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        content: article.content
      }))
    };
  }

  deduplicateArticles(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const key = article.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// GDELT API Service (alternative news source)
class GdeltService {
  constructor() {
    this.baseUrl = 'https://api.gdeltproject.org/api/v2/doc/doc';
  }

  async searchEvents(query, options = {}) {
    const {
      mode = 'ArtList',
      format = 'json',
      maxRecords = 50,
      timespan = '24h'
    } = options;

    const params = new URLSearchParams({ query, mode, format, maxrecords: maxRecords, timespan, sort: 'DateDesc' });
    const response = await httpsFetch(`${this.baseUrl}?${params}`);
    if (!response.ok) throw new Error(`GDELT HTTP ${response.status}`);
    return this.formatGdeltResponse(await response.json());
  }

  formatGdeltResponse(data) {
    // Format GDELT response based on the actual API structure
    if (Array.isArray(data)) {
      return data.map(item => ({
        url: item.url,
        title: item.title,
        seendate: item.seendate,
        domain: item.domain,
        language: item.language,
        tone: item.tone
      }));
    }
    return data;
  }
}

module.exports = new NewsApiService();
module.exports.GdeltService = GdeltService;
