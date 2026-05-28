let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch (error) {
  console.log('Puppeteer not available, scraping with Puppeteer will be disabled');
  puppeteer = null;
}

const cheerio = require('cheerio');
const { httpsFetch } = require('./httpsFetch');

class ScraperService {
  constructor() {
    this.sources = {
      bbc: {
        name: 'BBC News',
        baseUrl: 'https://www.bbc.com',
        searchUrl: 'https://www.bbc.co.uk/search?q=',
        selectors: {
          article: '.ssrcss-1m6szw1',
          title: '.ssrcss-1yf2db9',
          link: 'a',
          date: '.ssrcss-1yf2db9',
          content: '.ssrcss-11y1h7m'
        }
      },
      reuters: {
        name: 'Reuters',
        baseUrl: 'https://www.reuters.com',
        searchUrl: 'https://www.reuters.com/site-search/?query=',
        selectors: {
          article: '.search-result__item',
          title: '.search-result__title',
          link: 'a',
          date: '.search-result__timestamp',
          content: '.search-result__excerpt'
        }
      },
      nyt: {
        name: 'New York Times',
        baseUrl: 'https://www.nytimes.com',
        searchUrl: 'https://www.nytimes.com/search?query=',
        selectors: {
          article: 'li[data-testid="search-result"]',
          title: 'h3',
          link: 'a',
          date: 'span[data-testid="search-result-date"]',
          content: 'p'
        }
      },
      guardian: {
        name: 'The Guardian',
        baseUrl: 'https://www.theguardian.com',
        searchUrl: 'https://www.theguardian.com/search?q=',
        selectors: {
          article: '.fc-item',
          title: '.fc-item__title',
          link: 'a',
          date: '.fc-item__timestamp',
          content: '.fc-item__standfirst'
        }
      },
      wsj: {
        name: 'Wall Street Journal',
        baseUrl: 'https://www.wsj.com',
        searchUrl: 'https://www.wsj.com/search?q=',
        selectors: {
          article: '.WSJTheme--card--34F1d5yO',
          title: '.WSJTheme--headline--7BzoohY5',
          link: 'a',
          date: '.WSJTheme--timestamp--1EBIofq5',
          content: '.WSJTheme--summary--2lqFjMXB'
        }
      }
    };
  }

  async getAvailableSources() {
    return Object.keys(this.sources).map(key => ({
      id: key,
      name: this.sources[key].name,
      baseUrl: this.sources[key].baseUrl
    }));
  }

  async scrapeMultipleSources(sources, query) {
    const results = [];
    
    for (const sourceId of sources) {
      try {
        const articles = await this.scrapeSource(sourceId, query);
        results.push({
          source: this.sources[sourceId].name,
          articles: articles,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error scraping ${sourceId}:`, error.message);
        results.push({
          source: this.sources[sourceId].name,
          error: error.message,
          articles: []
        });
      }
    }

    return results;
  }

  async scrapeSource(sourceId, query) {
    const source = this.sources[sourceId];
    if (!source) {
      throw new Error(`Unknown source: ${sourceId}`);
    }

    // Use Puppeteer for JavaScript-heavy sites
    if (['nyt', 'wsj'].includes(sourceId)) {
      return await this.scrapeWithPuppeteer(source, query);
    }

    // Use Cheerio for simpler sites
    return await this.scrapeWithCheerio(source, query);
  }

  async scrapeWithCheerio(source, query) {
    try {
      const searchUrl = `${source.searchUrl}${encodeURIComponent(query)}`;
      const response = await httpsFetch(searchUrl, {
        headers: {
          'User-Agent': process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const $ = cheerio.load(await response.text());
      const articles = [];

      $(source.selectors.article).each((index, element) => {
        const $el = $(element);
        const title = $el.find(source.selectors.title).text().trim();
        const link = $el.find(source.selectors.link).attr('href');
        const date = $el.find(source.selectors.date).text().trim();
        const content = $el.find(source.selectors.content).text().trim();

        if (title && link) {
          articles.push({
            title,
            link: link.startsWith('http') ? link : `${source.baseUrl}${link}`,
            date,
            content: content || title,
            source: source.name
          });
        }
      });

      return articles.slice(0, 10); // Limit to 10 articles
    } catch (error) {
      console.error(`Cheerio scraping error for ${source.name}:`, error.message);
      throw error;
    }
  }

  async scrapeWithPuppeteer(source, query) {
    if (!puppeteer) {
      console.log(`Puppeteer not available, falling back to Cheerio for ${source.name}`);
      return await this.scrapeWithCheerio(source, query);
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      });

      const page = await browser.newPage();
      await page.setUserAgent(process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

      const searchUrl = `${source.searchUrl}${encodeURIComponent(query)}`;
      await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

      // Wait for content to load
      await page.waitForSelector(source.selectors.article, { timeout: 10000 }).catch(() => {
        console.log(`Selector ${source.selectors.article} not found, proceeding anyway`);
      });

      const articles = await page.evaluate((selectors) => {
        const results = [];
        document.querySelectorAll(selectors.article).forEach((element) => {
          const titleEl = element.querySelector(selectors.title);
          const linkEl = element.querySelector(selectors.link);
          const dateEl = element.querySelector(selectors.date);
          const contentEl = element.querySelector(selectors.content);

          if (titleEl && linkEl) {
            results.push({
              title: titleEl.textContent.trim(),
              link: linkEl.href,
              date: dateEl ? dateEl.textContent.trim() : '',
              content: contentEl ? contentEl.textContent.trim() : titleEl.textContent.trim()
            });
          }
        });
        return results;
      }, source.selectors);

      await browser.close();
      return articles.slice(0, 10);
    } catch (error) {
      console.error(`Puppeteer scraping error for ${source.name}:`, error.message);
      if (browser) await browser.close();
      // Fallback to Cheerio if Puppeteer fails
      console.log(`Falling back to Cheerio for ${source.name}`);
      return await this.scrapeWithCheerio(source, query);
    }
  }

  async scrapeArticleContent(url) {
    if (!puppeteer) {
      throw new Error('Puppeteer not available for article content scraping');
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      });

      const page = await browser.newPage();
      await page.setUserAgent(process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const content = await page.evaluate(() => {
        // Try common content selectors
        const selectors = [
          'article',
          '[role="article"]',
          '.article-body',
          '.story-body',
          '.content',
          'main'
        ];

        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            return element.textContent.trim();
          }
        }

        return document.body.textContent.trim();
      });

      await browser.close();
      return content;
    } catch (error) {
      console.error('Article content scraping error:', error.message);
      if (browser) await browser.close();
      throw error;
    }
  }

  async scrapeProfileNews(profileName) {
    const sources = ['bbc', 'reuters', 'guardian'];
    return await this.scrapeMultipleSources(sources, profileName);
  }
}

module.exports = new ScraperService();
