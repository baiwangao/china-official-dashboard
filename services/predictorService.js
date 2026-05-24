const natural = require('natural');
const Sentiment = require('sentiment');
const { httpsFetch } = require('./httpsFetch');

function isValidApiKey(key) {
  return Boolean(key && !/your_.*_here/i.test(key) && key.length > 20);
}

class PredictorService {
  constructor() {
    this.sentiment = new Sentiment();
    this.tokenizer = new natural.WordTokenizer();
    this.weights = {
      eventRisk: parseFloat(process.env.EVENT_RISK_WEIGHT) || 0.4,
      publicSignal: parseFloat(process.env.PUBLIC_SIGNAL_WEIGHT) || 0.3,
      promotion: parseFloat(process.env.PROMOTION_WEIGHT) || 0.3
    };
  }

  // ======= AI 升迁评分（支持 DeepSeek / Claude 双引擎） =======
  getProviderConfig() {
    const provider = (process.env.AI_PROVIDER || 'deepseek').toLowerCase();
    if (provider === 'deepseek') {
      return {
        name: 'DeepSeek',
        apiKey: process.env.DEEPSEEK_API_KEY || process.env.ANTHROPIC_API_KEY,
        baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        format: 'openai'  // OpenAI-compatible
      };
    }
    // Claude / Anthropic
    return {
      name: 'Claude',
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: process.env.CLAUDE_API_BASE_URL || 'https://api.anthropic.com/v1',
      model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
      format: 'anthropic'
    };
  }

  buildPrompt(profile) {
    return `你是一位中国政治体制分析专家。根据以下官员的公开档案，评估其未来两年内升迁前景或风险概率。

姓名：${profile.name}（${profile.age}岁）
职务：${profile.title}（${profile.rank}）
所在地区/系统：${profile.region} / ${profile.system}
关注度：${profile.attention}
仕途轨迹：${profile.path}
近期关键事件：${JSON.stringify((profile.events || []).map(e => ({type:e.type,title:e.title,impact:e.impact,confidence:e.confidence})))}
当前信号：${JSON.stringify(profile.signals || [])}
最近三次履历变动：${JSON.stringify((profile.timeline || []).slice(-3))}

请综合以下四个维度打分并返回纯 JSON（勿包含 markdown 标记）：
1. 年龄窗口：下届换届时是否在提名年龄线内
2. 事件性质：近期事件是正向（外事活动、表彰）还是负向（反腐通报、立案审查、重大事故）
3. 仕途速度：履职路径的升迁节奏和跨地区/跨系统广度
4. 异常信号：是否有关键人物落马牵连、长期未露面、职务"另有任用"悬置等

返回格式：
{"promotionScore":55,"trend":"上升","ageOK":true,"keyFactors":["因素1","因素2","因素3"],"mainRisk":"主要风险的简要描述，无则填无","summary":"一句话结论"}`
  }

  async aiPromotionScore(profile) {
    try {
      const cfg = this.getProviderConfig();
      if (!isValidApiKey(cfg.apiKey)) {
        console.log(`[AI] 未配置有效的 ${cfg.name} API Key，跳过 AI 评分`);
        return null;
      }

      const prompt = this.buildPrompt(profile);
      console.log(`[AI] Calling ${cfg.name} (${cfg.model}) for ${profile.name}...`);

      let response, data, text;

      if (cfg.format === 'openai') {
        response = await httpsFetch(`${cfg.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cfg.apiKey}`
          },
          body: JSON.stringify({
            model: cfg.model,
            messages: [
              { role: 'system', content: '你是一个严谨的中国政治分析专家。始终返回合法的纯 JSON，不要包含任何解释文字或 markdown 标记。' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 800,
            temperature: 0.3
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[${cfg.name}] HTTP ${response.status}: ${errText.substring(0, 300)}`);
          return null;
        }

        data = await response.json();
        text = data.choices?.[0]?.message?.content?.trim() || '';
      } else {
        // Anthropic 原生格式
        response = await httpsFetch(`${cfg.baseUrl}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': cfg.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: cfg.model,
            max_tokens: 800,
            messages: [{ role: 'user', content: prompt }]
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[${cfg.name}] HTTP ${response.status}: ${errText.substring(0, 300)}`);
          return null;
        }

        data = await response.json();
        text = data.content?.[0]?.text?.trim() || '';
      }

      const clean = text.replace(/```json\s*|```\s*/g, '').trim();
      const result = JSON.parse(clean);
      console.log(`[AI] ${profile.name}: score=${result.promotionScore} trend=${result.trend} summary=${result.summary}`);
      return result;
    } catch (err) {
      console.error(`[AI] 评分失败 (${profile.name}):`, err.message);
      return null;
    }
  }

  // ======= 规则打分（保留作为基础分） =======
  calcRuleScore(profile) {
    let score = 50;

    const age = profile.age || 60;
    const yearsToNext = 2027 - new Date().getFullYear();
    const ageAtCongress = age + yearsToNext;
    if (ageAtCongress <= 63) score += 20;
    else if (ageAtCongress <= 68) score += 8;
    else score -= 25;

    const events = profile.events || [];
    const diplomacy = events.filter(e => e.type === '外事活动').length;
    score += diplomacy * 8;

    const negative = events.some(e =>
      ['反腐通报', '异常信号'].includes(e.type)
    );
    if (negative) score -= 60;

    const accident = events.some(e => e.type === '重大事故');
    if (accident) score -= 20;

    if (profile.attention === '高' && !negative) score += 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  async predictProfile(profile) {
    const ruleScore = this.calcRuleScore(profile);
    const sentimentScore = await this.analyzeSentiment(profile);
    const trendScore = this.analyzeTrend(profile);
    const riskScore = this.calculateRiskScore(profile);

    // 调用 AI 评分（DeepSeek 或 Claude）
    let aiResult = null;
    const hasAIKey = isValidApiKey(process.env.DEEPSEEK_API_KEY)
      || isValidApiKey(process.env.ANTHROPIC_API_KEY);
    if (hasAIKey) {
      aiResult = await this.aiPromotionScore(profile);
    }

    // 合并打分：规则分60% + AI分40%
    let finalScore;
    if (aiResult) {
      finalScore = Math.round(ruleScore * 0.6 + aiResult.promotionScore * 0.4);
    } else {
      finalScore = ruleScore;
    }

    return {
      profileId: profile.id,
      name: profile.name,
      prediction: this.generatePrediction(finalScore, sentimentScore, trendScore, riskScore),
      confidence: this.calculateConfidence(profile),
      factors: {
        ruleScore,
        sentimentScore,
        trendScore,
        riskScore,
        aiScore: aiResult ? aiResult.promotionScore : null
      },
      aiAnalysis: aiResult,
      recommendations: this.generateRecommendations(profile, ruleScore, sentimentScore, riskScore),
      timestamp: new Date().toISOString()
    };
  }

  async predictBatch(profiles) {
    const predictions = [];
    for (const profile of profiles) {
      const result = await this.predictProfile(profile);
      predictions.push(result);
      await new Promise(r => setTimeout(r, 500));
    }
    return predictions;
  }

  calculateBaseScore(profile) {
    const promotionScore = profile.promotion || 50;
    const mobilityScore = profile.mobility || 50;
    const publicSignalScore = profile.publicSignal || 50;
    const eventRiskScore = profile.eventRisk || 50;
    return Math.round(
      promotionScore * 0.3 +
      mobilityScore * 0.2 +
      publicSignalScore * 0.2 +
      (100 - eventRiskScore) * 0.3
    );
  }

  async analyzeSentiment(profile) {
    let sentimentScore = 50;
    if (profile.events && profile.events.length > 0) {
      const eventTexts = profile.events.map(e =>
        `${e.type} ${e.title} ${e.relation}`
      ).join(' ');
      const result = this.sentiment.analyze(eventTexts);
      sentimentScore = Math.max(0, Math.min(100, ((result.score + 5) / 10) * 100));
    }
    if (profile.signals && profile.signals.length > 0) {
      const signalTexts = profile.signals.map(s => s.join(' ')).join(' ');
      const result = this.sentiment.analyze(signalTexts);
      const norm = Math.max(0, Math.min(100, ((result.score + 5) / 10) * 100));
      sentimentScore = (sentimentScore + norm) / 2;
    }
    return Math.round(sentimentScore);
  }

  analyzeTrend(profile) {
    let trendScore = 50;
    if (profile.timeline && profile.timeline.length > 1) {
      const keywords = ['市长', '书记', '主任', '部长', '局长', '副书记', '总经理', '省长'];
      let positive = 0;
      const total = profile.timeline.length - 1;
      for (let i = 1; i < profile.timeline.length; i++) {
        const cur = profile.timeline[i][1];
        const prev = profile.timeline[i - 1][1];
        if (keywords.some(k => cur.includes(k) && !prev.includes(k))) positive++;
      }
      if (total > 0) trendScore = (positive / total) * 100;
    }
    return Math.round(trendScore);
  }

  calculateRiskScore(profile) {
    let riskScore = 0;
    if (profile.eventRisk) riskScore += profile.eventRisk * 0.5;
    if (profile.attention === '高') riskScore += 20;
    else if (profile.attention === '中') riskScore += 10;
    if (profile.events) {
      const high = profile.events.filter(e => e.impact === '高').length;
      riskScore += high * 15;
      const unverified = profile.events.filter(e =>
        ['未交叉验证', '未核验'].includes(e.confidence)
      ).length;
      riskScore += unverified * 10;
    }
    return Math.min(100, Math.round(riskScore));
  }

  generatePrediction(baseScore, sentimentScore, trendScore, riskScore) {
    const weighted = (
      baseScore * 0.3 +
      sentimentScore * 0.25 +
      trendScore * 0.2 +
      (100 - riskScore) * 0.25
    );
    let prediction, category;
    if (weighted >= 75) { prediction = '升迁前景积极'; category = 'positive'; }
    else if (weighted >= 60) { prediction = '发展态势平稳'; category = 'neutral'; }
    else if (weighted >= 45) { prediction = '需持续观察'; category = 'caution'; }
    else { prediction = '存在风险因素'; category = 'risk'; }
    return { score: Math.round(weighted), prediction, category };
  }

  calculateConfidence(profile) {
    let c = 0.5;
    if (profile.sources) c += Math.min(profile.sources.length * 0.1, 0.3);
    if (profile.timeline && profile.timeline.length > 2) c += 0.1;
    if (profile.events) {
      const verified = profile.events.filter(e =>
        ['已核验', '官方通报', '中央纪委官网', '新华社官方通报'].includes(e.confidence)
      ).length;
      if (profile.events.length > 0) c += (verified / profile.events.length) * 0.1;
    }
    return Math.min(0.95, Math.max(0.1, c));
  }

  generateRecommendations(profile, baseScore, sentimentScore, riskScore) {
    const recs = [];
    if (riskScore >= 60) recs.push({ type: 'risk', priority: 'high', message: '建议重点关注近期事件发展，密切监控官方通报' });
    if (riskScore >= 40 && riskScore < 60) recs.push({ type: 'risk', priority: 'medium', message: '建议定期更新事件信息，核实未验证来源' });
    if (baseScore >= 70 && sentimentScore >= 60) recs.push({ type: 'opportunity', priority: 'medium', message: '当前指标显示升迁窗口期，建议关注相关岗位变动' });
    if (!profile.sources || profile.sources.length < 2) recs.push({ type: 'data', priority: 'low', message: '建议补充更多官方来源信息以提高分析准确性' });
    return recs;
  }

  async updateAllPredictions() {
    const dataManager = require('./dataManager');
    const profiles = await dataManager.getProfiles();
    const predictions = await this.predictBatch(profiles);
    await dataManager.savePredictions(predictions);
    return { total: predictions.length, predictions };
  }

  async analyzeNewsImpact(newsArticles, profile) {
    const impact = { positive: 0, negative: 0, neutral: 0, relevant: 0, details: [] };
    const keywords = [profile.name, profile.region, profile.system];
    for (const article of newsArticles) {
      const text = `${article.title} ${article.description || ''}`.toLowerCase();
      const isRelevant = keywords.some(k => k && text.includes(k.toLowerCase()));
      if (isRelevant) {
        impact.relevant++;
        const s = this.sentiment.analyze(text);
        if (s.score > 2) impact.positive++;
        else if (s.score < -2) impact.negative++;
        else impact.neutral++;
        impact.details.push({ title: article.title, source: article.source, sentiment: s.score });
      }
    }
    return impact;
  }
}

module.exports = new PredictorService();
