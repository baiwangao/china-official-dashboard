/**
 * 怀仁堂专项搜索关键词库
 * 分三层：精准词（直接命中率高）、扩展词（覆盖周边报道）、官媒 RSS（直抓）
 */

const PRIMARY_QUERIES = [
  '怀仁堂 会议',
  '怀仁堂 座谈',
  '怀仁堂 表彰大会',
  '中南海 怀仁堂',
  '政治局 怀仁堂',
];

const SECONDARY_QUERIES = [
  '怀仁堂 颁奖',
  '怀仁堂 颁发',
  '怀仁堂 全国人大',
  '怀仁堂 国务院',
  'Huairentang meeting',
  'Huairentang ceremony',
];

// 官媒 RSS feed，抓取后在内容里过滤"怀仁堂"关键字
const OFFICIAL_RSS_FEEDS = [
  { name: '新华社政治', url: 'http://www.xinhuanet.com/politics/index.rss' },
  { name: '人民网政治', url: 'http://politics.people.com.cn/rss/zhengzhi.xml' },
  { name: 'CCTV新闻',  url: 'https://news.cctv.com/rss/china.xml' },
];

const HUAIRENTANG_KEYWORDS = ['怀仁堂', 'Huairentang', 'Huai Ren Tang'];

module.exports = { PRIMARY_QUERIES, SECONDARY_QUERIES, OFFICIAL_RSS_FEEDS, HUAIRENTANG_KEYWORDS };
