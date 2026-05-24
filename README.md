# 中国官员仕途情报评估台

基于真实API和海外媒体爬虫的官员仕途预测分析系统。

## 功能特性

- **真实API集成**: 集成NewsAPI和GDELT等新闻API获取海外媒体报道
- **海外媒体爬虫**: 支持BBC、Reuters、NYT、Guardian、WSJ等主流海外媒体爬取
- **AI预测模型**: 基于情感分析和风险评估的仕途预测
- **实时数据更新**: 定时任务自动更新新闻和爬虫数据
- **可视化界面**: 直观的仪表板展示官员档案和预测结果

## 技术栈

### 后端
- Node.js + Express
- Puppeteer (网页爬虫)
- Cheerio (HTML解析)
- Axios (HTTP请求)
- Natural (自然语言处理)
- Sentiment (情感分析)
- node-cron (定时任务)

### 前端
- 原生HTML/CSS/JavaScript
- 响应式设计

## 安装配置

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并配置相关参数：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# News API Configuration
NEWS_API_KEY=your_newsapi_key_here
GDELT_API_KEY=your_gdelt_key_here

# Scraping Configuration
SCRAPER_USER_AGENT=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
SCRAPER_DELAY_MIN=1000
SCRAPER_DELAY_MAX=3000

# Server Configuration
PORT=3000
NODE_ENV=development

# Prediction Model Configuration
SENTIMENT_THRESHOLD=0.3
EVENT_RISK_WEIGHT=0.4
PUBLIC_SIGNAL_WEIGHT=0.3
PROMOTION_WEIGHT=0.3
```

### 3. 获取API密钥

#### NewsAPI
1. 访问 https://newsapi.org/
2. 注册账号并获取免费API密钥
3. 将密钥填入 `.env` 文件的 `NEWS_API_KEY`

#### GDELT (可选)
1. 访问 https://www.gdeltproject.org/
2. 获取API访问权限
3. 将密钥填入 `.env` 文件的 `GDELT_API_KEY`

## 运行项目

### 开发模式

```bash
npm run dev
```

### 生产模式

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## API接口

### 档案管理

- `GET /api/profiles` - 获取所有官员档案
- `GET /api/profiles/:id` - 获取指定档案
- `POST /api/profiles` - 创建新档案
- `PUT /api/profiles/:id` - 更新档案

### 新闻API

- `GET /api/news/search?query=xxx` - 搜索新闻
- `GET /api/news/profile/:name` - 获取指定人物的新闻

### 爬虫API

- `POST /api/scrape/media` - 爬取多个媒体源
- `GET /api/scrape/sources` - 获取可用媒体源

### 预测API

- `POST /api/predict/profile` - 预测单个档案
- `POST /api/predict/batch` - 批量预测
- `GET /api/predict/update-all` - 更新所有预测

### 数据更新

- `POST /api/update/news` - 从新闻API更新数据
- `POST /api/update/scrape` - 从爬虫更新数据

## 数据结构

### 官员档案 (Profile)

```json
{
  "id": "unique-id",
  "name": "姓名",
  "age": 45,
  "region": "地区",
  "system": "系统",
  "title": "职务",
  "attention": "关注级别",
  "promotion": 78,
  "mobility": 62,
  "publicSignal": 38,
  "eventRisk": 44,
  "rank": "职级",
  "path": "履历路径",
  "signals": [["信号标题", "信号描述"]],
  "timeline": [["年份", "事件"]],
  "events": [{
    "type": "事件类型",
    "title": "事件标题",
    "date": "日期",
    "impact": "影响程度",
    "confidence": "可信度",
    "relation": "关联说明"
  }],
  "sources": ["来源1", "来源2"]
}
```

### 预测结果 (Prediction)

```json
{
  "profileId": "profile-id",
  "name": "姓名",
  "prediction": {
    "score": 75,
    "prediction": "升迁前景积极",
    "category": "positive"
  },
  "confidence": 0.85,
  "factors": {
    "baseScore": 70,
    "sentimentScore": 65,
    "trendScore": 80,
    "riskScore": 30
  },
  "recommendations": [{
    "type": "risk",
    "priority": "high",
    "message": "建议重点关注"
  }],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 支持的媒体源

- **BBC News** - 英国广播公司
- **Reuters** - 路透社
- **New York Times** - 纽约时报
- **The Guardian** - 卫报
- **Wall Street Journal** - 华尔街日报

## 定时任务

系统默认配置以下定时任务：

- **每6小时**: 从新闻API更新数据
- **每12小时**: 运行爬虫更新数据

可以在 `server.js` 中修改定时任务配置。

## 数据存储

数据存储在 `data/` 目录：

- `leadership.json` - 官员档案数据
- `predictions.json` - 预测结果缓存
- `news-cache.json` - 新闻数据缓存

## 注意事项

1. **API限制**: NewsAPI免费版有请求限制，请注意使用频率
2. **爬虫合规**: 使用爬虫时请遵守目标网站的robots.txt和使用条款
3. **数据准确性**: 海外媒体报道可能存在偏见，建议交叉验证
4. **隐私保护**: 系统仅分析公开信息，不涉及个人隐私数据

## 开发说明

### 添加新的媒体源

在 `services/scraperService.js` 中的 `this.sources` 对象添加新的媒体源配置：

```javascript
newSource: {
  name: 'Source Name',
  baseUrl: 'https://example.com',
  searchUrl: 'https://example.com/search?q=',
  selectors: {
    article: 'article-selector',
    title: 'title-selector',
    link: 'link-selector',
    date: 'date-selector',
    content: 'content-selector'
  }
}
```

### 调整预测模型

在 `services/predictorService.js` 中调整预测算法和权重：

```javascript
this.weights = {
  eventRisk: 0.4,
  publicSignal: 0.3,
  promotion: 0.3
};
```

## 许可证

MIT License

## 免责声明

本系统仅用于学术研究和信息分析，所有预测基于公开数据和算法模型，不构成任何投资或决策建议。使用者应自行判断和承担使用本系统的风险。
