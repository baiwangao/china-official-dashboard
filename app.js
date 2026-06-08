const API_TOKEN = document.querySelector('meta[name="api-auth-token"]')?.content || '';

function apiFetch(url, opts) {
  opts = opts || {};
  if (API_TOKEN) {
    opts.headers = opts.headers || {};
    opts.headers['x-api-key'] = API_TOKEN;
  }
  return fetch(url, opts);
}

let profiles = [
  {
    id: "liu-xiaoming",
    name: "刘小明",
    age: 61,
    region: "华南",
    system: "地方党政",
    title: "海南省委副书记、省长",
    attention: "中",
    promotion: 72,
    mobility: 55,
    publicSignal: 42,
    eventRisk: 48,
    rank: "正部级",
    path: "交通运输部公路司 → 交通运输部运输服务司司长 → 交通运输部副部长 → 广西党委副书记 → 海南省省长",
    signals: [
      ["升迁窗口", "从中央部委到地方主官，历经省级党委副书记过渡阶段，路径标准。"],
      ["岗位结构", "交通系统专业背景与自贸港建设需求匹配度高，岗位稳定期为主。"],
      ["公开关注", "海南自贸港建设为高关注话题，省长岗位能见度持续提升。"],
    ],
    timeline: [
      ["2016", "任交通运输部副部长。"],
      ["2022", "任广西壮族自治区党委副书记。"],
      ["2023", "任海南省委副书记、省长。"],
    ],
    events: [
      {
        type: "自贸港建设",
        title: "海南自贸港2025年底封关运作准备工作",
        date: "2025-12",
        impact: "中",
        confidence: "官方发布",
        relation: "省政府承担封关运作的关键执行任务，履职成果受高度关注。",
      },
    ],
    sources: ["海南省人民政府官网", "新华社海南频道", "交通运输部官网"],
  },
  {
    id: "hao-peng",
    name: "郝鹏",
    age: 65,
    region: "东北",
    system: "地方党政",
    title: "辽宁省委书记、省人大常委会主任",
    attention: "中",
    promotion: 62,
    mobility: 48,
    publicSignal: 55,
    eventRisk: 58,
    rank: "正部级",
    path: "中航工业兰州飞控 → 甘肃省国防科工办 → 中航工业集团副总 → 青海省委副书记 → 国资委主任 → 辽宁省委书记",
    signals: [
      ["升迁窗口", "年龄接近副国级观察线，从国资委主任转任省委书记为晋升关键一步。"],
      ["岗位结构", "国企改革背景与东北振兴战略高度匹配，任务导向明确。"],
      ["公开关注", "东北振兴和辽宁经济转型为持续性高关注话题。"],
    ],
    timeline: [
      ["2016", "任国务院国有资产监督管理委员会党委书记、主任。"],
      ["2022", "任辽宁省委书记。"],
      ["2023", "兼任辽宁省人大常委会主任。"],
    ],
    events: [
      {
        type: "经济转型",
        title: "辽宁省2025年GDP增速未达年度目标",
        date: "2026-01",
        impact: "中",
        confidence: "官方统计公报",
        relation: "经济发展指标直接影响治理绩效评价和干部考核。",
      },
      {
        type: "营商环境",
        title: "辽宁出台新一轮优化营商环境条例",
        date: "2025-08",
        impact: "低",
        confidence: "省级立法公告",
        relation: "为正向政策信号，但需观察执行效果。",
      },
    ],
    sources: ["辽宁省人民政府官网", "国资委公开信息", "新华社辽宁频道"],
  },
  {
    id: "zheng-shajie",
    name: "郑栅洁",
    age: 64,
    region: "中央",
    system: "国务院",
    title: "国家发展和改革委员会党组书记、主任",
    attention: "高",
    promotion: 68,
    mobility: 52,
    publicSignal: 65,
    eventRisk: 62,
    rank: "正部级",
    path: "福建省委秘书长 → 福建省副省长 → 国家能源局副局长 → 浙江省长 → 安徽省委书记 → 国家发改委主任",
    signals: [
      ["升迁窗口", "国家发改委主任为国务院重要岗位，属正部级权力核心。"],
      ["岗位结构", "从地方到中央经济综合部门，履职经历跨东中西，视野完整。"],
      ["公开关注", "宏观经济形势和投资审批为焦点话题，主任岗位处于风口浪尖。"],
    ],
    timeline: [
      ["2015", "任国家能源局副局长。"],
      ["2017", "任浙江省委常委、宁波市委书记。"],
      ["2020", "任浙江省委副书记、省长。"],
      ["2021", "任安徽省委书记。"],
      ["2023", "任国家发展和改革委员会主任。"],
    ],
    events: [
      {
        type: "经济调控",
        title: "2026年一季度GDP增速低于市场预期",
        date: "2026-04",
        impact: "高",
        confidence: "国家统计局发布",
        relation: "发改委为宏观经济调控核心部门，经济表现直接影响履职评价。",
      },
      {
        type: "投资审批",
        title: "多地新增专项债额度提前下达推进",
        date: "2026-02",
        impact: "中",
        confidence: "财政部联合发文",
        relation: "重大项目投资审批提速反映发改委政策导向。",
      },
    ],
    sources: ["国家发改委官网", "新华社经济频道", "国务院公报"],
  },
  {
    id: "li-bingjun",
    name: "李炳军",
    age: 63,
    region: "西南",
    system: "地方党政",
    title: "贵州省委副书记、省长",
    attention: "中",
    promotion: 58,
    mobility: 44,
    publicSignal: 35,
    eventRisk: 46,
    rank: "正部级",
    path: "国务院办公厅 → 国办秘书局 → 国务院副秘书长 → 江西省副省长 → 赣州市委书记 → 江西省委副书记 → 贵州省长",
    signals: [
      ["升迁窗口", "国办系统出身，从江西副省长到贵州省长的晋升路径较为集中。"],
      ["岗位结构", "贵州省长岗位面临债务化解和产业转型双重压力，治理挑战较大。"],
      ["公开关注", "贵州地方债务和经济转型为近年舆论关注焦点。"],
    ],
    timeline: [
      ["2013", "任江西省人民政府副省长。"],
      ["2015", "任江西省委常委、赣州市委书记。"],
      ["2018", "任江西省委副书记、赣州市委书记。"],
      ["2020", "任贵州省委副书记、省长。"],
    ],
    events: [
      {
        type: "债务风险",
        title: "贵州多地推进政府债务化解方案",
        date: "2025-10",
        impact: "中",
        confidence: "官方通报",
        relation: "地方债务化解是贵州省核心治理任务，直接影响财政稳健和发展空间。",
      },
      {
        type: "大数据产业",
        title: "贵州获批新一轮国家大数据综合试验区政策",
        date: "2026-01",
        impact: "低",
        confidence: "国务院批复",
        relation: "有利产业政策，但需关注政策落地与招商引资实效。",
      },
    ],
    sources: ["贵州省人民政府官网", "新华社贵州频道", "贵州日报"],
  },
];

const filterState = {
  region: "全部",
  system: "全部",
  attention: "全部",
  query: "",
  selectedId: "",
};

const attentionFilters = ["全部", "低", "中", "高"];

const profileList = document.querySelector("#profileList");
const detailPane = document.querySelector("#detailPane");
const resultCount = document.querySelector("#resultCount");
const searchInput = document.querySelector("#searchInput");
const addProfileDialog = document.querySelector("#addProfileDialog");
const addProfileForm = document.querySelector("#addProfileForm");
const addProfileError = document.querySelector("#addProfileError");
const submitAddProfileBtn = document.querySelector("#submitAddProfileBtn");

const CUSTOM_STORAGE_KEY = "dashboard_custom_profiles";

function loadCustomFromStorage() {
  try {
    const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(normalizeProfile) : [];
  } catch {
    return [];
  }
}

function saveCustomToStorage(customProfiles) {
  localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customProfiles));
}

function mergeCustomProfiles(baseProfiles) {
  const custom = loadCustomFromStorage();
  const ids = new Set(baseProfiles.map((p) => p.id));
  const merged = [...baseProfiles];
  for (const profile of custom) {
    if (!ids.has(profile.id)) {
      merged.push(profile);
      ids.add(profile.id);
    }
  }
  return merged;
}

function removeCustomFromStorage(profileId) {
  const next = loadCustomFromStorage().filter((p) => p.id !== profileId);
  saveCustomToStorage(next);
}

function slugifyName(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fff-]/g, "");
}

function parseTimelineText(text) {
  if (!text?.trim()) return [];
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[|｜\t]/);
      const year = (parts[0] || "").trim();
      const event = parts.slice(1).join(" ").trim() || parts[0]?.trim();
      return year && event ? [year, event] : null;
    })
    .filter(Boolean);
}

function buildProfileFromForm(formData) {
  const name = formData.get("name")?.trim();
  const age = Number(formData.get("age"));
  const title = formData.get("title")?.trim();
  const path = formData.get("path")?.trim();
  const notes = formData.get("notes")?.trim();
  const timeline = parseTimelineText(formData.get("timeline"));

  if (!name) throw new Error("请填写姓名");
  if (!title) throw new Error("请填写现任职务");
  if (!Number.isFinite(age) || age < 18 || age > 100) throw new Error("请填写有效年龄（18–100）");

  const signals = [
    ["录入方式", "用户手动添加的档案，建议后续补充官方来源链接。"],
  ];
  if (path) signals.push(["仕途轨迹", path]);
  if (notes) signals.push(["补充说明", notes]);

  return normalizeProfile({
    id: `manual-${slugifyName(name) || "profile"}-${Date.now()}`,
    custom: true,
    name,
    age,
    title,
    rank: formData.get("rank") || "职级待核验",
    region: formData.get("region")?.trim() || "未分类",
    system: formData.get("system")?.trim() || "地方党政",
    attention: formData.get("attention") || "中",
    path: path || "用户录入，待补充完整公开履历。",
    promotion: Number(formData.get("promotion")) || 50,
    mobility: Number(formData.get("mobility")) || 50,
    eventRisk: Number(formData.get("eventRisk")) || 0,
    publicSignal: Number(formData.get("publicSignal")) || 30,
    signals,
    timeline: timeline.length ? timeline : [["录入", title]],
    events: [],
    sources: ["用户手动录入"],
  });
}

function openAddProfileDialog() {
  document.querySelector("#addProfileDialog").showModal();
}

function setAddProfileName(name) {
  const input = document.querySelector('#addProfileForm input[name="name"]');
  if (input) input.value = name;
}

function closeAddProfileDialog() {
  addProfileDialog.close();
}

async function persistProfile(profile) {
  try {
    const response = await apiFetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `保存失败 (${response.status})`);
    }
    const saved = await response.json();
    removeCustomFromStorage(profile.id);
    return normalizeProfile(saved);
  } catch (error) {
    console.log("API save failed, using local storage:", error.message);
    const custom = loadCustomFromStorage();
    custom.push(profile);
    saveCustomToStorage(custom);
    return profile;
  }
}

async function handleAddProfileSubmit(event) {
  event.preventDefault();
  addProfileError.hidden = true;
  submitAddProfileBtn.disabled = true;
  submitAddProfileBtn.textContent = "保存中…";

  try {
    const draft = buildProfileFromForm(new FormData(addProfileForm));
    const saved = await persistProfile(draft);

    const existingIdx = profiles.findIndex((p) => p.id === saved.id);
    if (existingIdx >= 0) profiles[existingIdx] = saved;
    else profiles.unshift(saved);

    filterState.selectedId = saved.id;
    filterState.query = "";
    searchInput.value = "";
    closeAddProfileDialog();
    render();
    await renderDetail(saved);
    document.querySelector("#profiles")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    addProfileError.hidden = false;
    addProfileError.textContent = error.message || "保存失败，请检查填写内容";
  } finally {
    submitAddProfileBtn.disabled = false;
    submitAddProfileBtn.textContent = "保存并 AI 分析";
  }
}

function scoreColor(value) {
  if (value >= 70) return "var(--rose)";
  if (value >= 50) return "var(--amber)";
  return "var(--jade)";
}

function metricColor(label, value) {
  if (label === "升迁窗口") return value >= 65 ? "var(--jade)" : value >= 45 ? "var(--amber)" : "var(--rose)";
  if (label === "岗位变动") return value >= 70 ? "var(--amber)" : "var(--jade)";
  return scoreColor(value);
}

function attentionClass(value) {
  return value === "高" ? "rose" : value === "中" ? "amber" : "jade";
}

function reviewStatus(profile) {
  if (profile.eventRisk >= 75 || profile.attention === "高") return ["重点复核", "rose"];
  if (profile.eventRisk >= 50 || profile.attention === "中") return ["持续观察", "amber"];
  return ["低关注", "jade"];
}

function sourceStatus(profile) {
  const verified = profile.sources.some((source) => /^https?:\/\//.test(source) || source.includes("官方"));
  return verified ? "来源已登记" : "待补来源";
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function aiTrendClass(trend) {
  if (trend === "上升") return "jade";
  if (trend === "危险" || trend === "下降") return "rose";
  return "amber";
}

function predictionCategoryLabel(category) {
  const map = { positive: "积极", neutral: "平稳", caution: "观察", risk: "风险" };
  return map[category] || category;
}

function renderDetailLoading(profile) {
  const [status, statusClass] = reviewStatus(profile);
  detailPane.innerHTML = `
    <div class="detail-title-row">
      <div>
        <div class="person-name">${escapeHtml(profile.name)}</div>
        <p class="person-subtitle">${profile.age}岁 · ${escapeHtml(profile.region)} · ${escapeHtml(profile.system)} · ${escapeHtml(profile.rank)}</p>
      </div>
      <span class="tag ${statusClass}">${status}</span>
    </div>
    <div class="detail-loading" aria-busy="true">
      <div class="loading-spinner" aria-hidden="true"></div>
      <p>正在调用 AI 模型分析升迁信号…</p>
      <small>规则引擎已就绪，DeepSeek 深度分析约需 3–8 秒</small>
    </div>
  `;
}

function renderInsightHero(predictionData) {
  if (!predictionData) return "";

  const p = predictionData.prediction;
  const factors = predictionData.factors || {};
  const ai = predictionData.aiAnalysis;
  const ruleScore = factors.ruleScore ?? "—";
  const aiScore = factors.aiScore;
  const finalScore = p.score;
  const hasAi = Boolean(ai);

  const weightedNote =
    hasAi && aiScore != null
      ? `${ruleScore} × 60% + ${aiScore} × 40%`
      : "仅规则引擎评分";

  const predictionCard = `
    <div class="prediction-card ${p.category}">
      <div class="prediction-score-ring" aria-label="综合得分 ${finalScore}">
        <strong>${finalScore}</strong>
        <small>/100</small>
      </div>
      <div class="prediction-card-body">
        <span class="eyebrow">AI 预测评估</span>
        <h4 class="prediction-verdict">${escapeHtml(p.prediction)}</h4>
        <div class="prediction-meta">
          <span class="tag ${p.category}">${predictionCategoryLabel(p.category)}</span>
          <span>置信度 ${Math.round(predictionData.confidence * 100)}%</span>
        </div>
      </div>
    </div>
  `;

  if (!hasAi) {
    return `
      <section class="insight-hero insight-hero--solo" aria-label="AI 研判">
        ${predictionCard}
        <div class="ai-analysis-panel disabled">
          <p class="ai-placeholder">AI 深度分析未返回结果，请检查 API 配置或稍后重试。</p>
        </div>
      </section>
    `;
  }

  const riskBlock =
    ai.mainRisk && ai.mainRisk !== "无"
      ? `<div class="ai-risk-alert" role="alert">
          <span class="ai-risk-label">主要风险</span>
          <p>${escapeHtml(ai.mainRisk)}</p>
        </div>`
      : "";

  const factorsList = (ai.keyFactors || [])
    .map(
      (f, i) => `
      <li class="factor-item">
        <span class="factor-index">${i + 1}</span>
        <span>${escapeHtml(f)}</span>
      </li>`,
    )
    .join("");

  return `
    <section class="insight-hero" aria-label="AI 研判">
      ${predictionCard}
      <div class="ai-analysis-panel">
        <div class="ai-head">
          <div>
            <span class="eyebrow">AI 深度分析</span>
            <span class="ai-provider-hint">DeepSeek · 加权综合</span>
          </div>
          <span class="tag ${aiTrendClass(ai.trend)}">趋势 ${escapeHtml(ai.trend)}</span>
        </div>

        <div class="score-formula">
          <div class="formula-track" aria-hidden="true">
            <div class="formula-segment rule" style="width:60%"></div>
            <div class="formula-segment ai" style="width:40%"></div>
          </div>
          <div class="formula-scores">
            <div class="formula-cell">
              <span>规则引擎</span>
              <strong>${ruleScore}</strong>
              <em>×60%</em>
            </div>
            <div class="formula-op">+</div>
            <div class="formula-cell highlight">
              <span>AI 模型</span>
              <strong>${aiScore}</strong>
              <em>×40%</em>
            </div>
            <div class="formula-op">=</div>
            <div class="formula-cell final">
              <span>综合</span>
              <strong>${finalScore}</strong>
            </div>
          </div>
          <p class="formula-caption">${weightedNote} → 综合 ${finalScore} 分</p>
        </div>

        <blockquote class="ai-summary-text">${escapeHtml(ai.summary)}</blockquote>
        ${riskBlock}

        <div class="ai-factors">
          <span class="eyebrow">关键因素</span>
          <ol class="factor-list">${factorsList}</ol>
        </div>

        <div class="ai-meta-row">
          <span class="ai-meta-chip ${ai.ageOK ? "ok" : "warn"}">年龄窗口 ${ai.ageOK ? "合格" : "受限"}</span>
        </div>
      </div>
    </section>
  `;
}

function generateOpinionSignals(profile) {
  const sigs = [];

  // 检测中纪委通报 —— 最高优先级
  const ccdiKeywords = ['反腐通报', '落马通报', '立案审查', '被立案', '官宣落马', '已被带走', '被留置', '涉嫌严重违纪'];
  const isCCDITarget = (profile.events || []).some(function (e) {
    return ccdiKeywords.some(function (k) {
      return (e.type || '').indexOf(k) !== -1 || (e.title || '').indexOf(k) !== -1;
    });
  }) || /已被立案审查|已被带走|被留置/.test(profile.title || '');

  if (isCCDITarget) {
    sigs.push(["中纪委通报", "该官员已被中央纪委国家监委立案审查调查，政治生涯已实质性终结。"]);
    sigs.push(["风险拉满", "事件风险系数 100/100，升迁窗口关闭。重点关注案件进展和连带追责范围。"]);
    if ((profile.events || []).filter(function (e) { return e.impact === '高'; }).length >= 2) {
      sigs.push(["连环调查", "多起高影响事件叠加，反腐扩线风险极高。"]);
    }
    return sigs;
  }

  if (profile.eventRisk >= 70) {
    sigs.push(["舆论风险", "事件风险处于高位，相关报道和讨论频率可能显著上升。"]);
  }
  if (profile.publicSignal >= 60) {
    sigs.push(["媒体关注", "公开报道密度较高，舆情压力持续存在。"]);
  }
  if (profile.attention === "高") {
    sigs.push(["舆论聚焦", "高关注度意味着任何新增事件都可能引发舆论放大效应。"]);
  }
  const highImpact = profile.events.filter(function (e) { return e.impact === "高"; });
  if (highImpact.length > 0) {
    sigs.push(["敏感事件", highImpact.length + " 件高影响事件可能成为舆论引爆点。"]);
  }
  const unverified = profile.events.filter(function (e) {
    return (e.confidence || "").includes("未核验") || (e.confidence || "").includes("未交叉") || (e.confidence || "").includes("路边");
  });
  if (unverified.length > 0) {
    sigs.push(["信息缺口", unverified.length + " 件事件未完成交叉验证，舆论可能填补信息真空。"]);
  }
  if (sigs.length === 0) {
    sigs.push(["舆论平稳", "当前无显著舆论异常信号，公开讨论温度正常。"]);
  }
  return sigs;
}

function generateOpinionData(profile) {
  // 中纪委通报直接拉满
  const ccdiKeywords = ['反腐通报', '落马通报', '立案审查', '被立案', '官宣落马', '已被带走', '被留置', '涉嫌严重违纪'];
  const isCCDITarget = (profile.events || []).some(function (e) {
    return ccdiKeywords.some(function (k) {
      return (e.type || '').indexOf(k) !== -1 || (e.title || '').indexOf(k) !== -1;
    });
  }) || /已被立案审查|已被带走|被留置/.test(profile.title || '');

  var rawScore, trend;
  if (isCCDITarget) {
    rawScore = 100;
    trend = "危险";
  } else {
    rawScore = Math.round((profile.publicSignal || 0) * 0.5 + (profile.eventRisk || 0) * 0.5);
    if (profile.eventRisk >= 65) trend = "上升";
    else if (profile.eventRisk >= 35) trend = "平稳";
    else trend = "下降";
  }

  var affected = (profile.events || []).slice().sort(function (a, b) {
    var scoreA = (a.impact === "高" ? 3 : a.impact === "中" ? 2 : 1);
    var confA = (a.confidence || "");
    if (confA.includes("未核验") || confA.includes("未交叉") || confA.includes("路边")) scoreA *= 1.6;
    var scoreB = (b.impact === "高" ? 3 : b.impact === "中" ? 2 : 1);
    var confB = (b.confidence || "");
    if (confB.includes("未核验") || confB.includes("未交叉") || confB.includes("路边")) scoreB *= 1.6;
    return scoreB - scoreA;
  });

  return {
    score: Math.min(100, rawScore),
    trend: trend,
    signals: generateOpinionSignals(profile),
    affectedEvents: affected,
  };
}

function createFilterButtons(containerId, key, values) {
  const container = document.querySelector(containerId);
  container.innerHTML = values
    .map(
      (value) =>
        `<button class="chip" type="button" data-filter-key="${key}" data-filter-value="${value}" aria-pressed="${filterState[key] === value}">${value}</button>`,
    )
    .join("");
}

function getRegionFilters() {
  return ["全部", ...new Set(profiles.map((profile) => profile.region))];
}

function getSystemFilters() {
  return ["全部", ...new Set(profiles.map((profile) => profile.system))];
}

function normalizeProfile(profile) {
  return {
    id: profile.id || `${profile.name}-${profile.title}`.replace(/\s+/g, "-"),
    custom: Boolean(profile.custom),
    name: profile.name || "未知",
    age: profile.age || "未知",
    region: profile.region || "未分类",
    system: profile.system || "地方党政",
    title: profile.title || "公开职务待补充",
    attention: profile.attention || "低",
    promotion: profile.promotion ?? 50,
    mobility: profile.mobility ?? 50,
    publicSignal: profile.publicSignal ?? 0,
    eventRisk: profile.eventRisk ?? 0,
    opinionScore: profile.opinionScore ?? 0,
    rank: profile.rank || "职级待核验",
    path: profile.path || "公开履历待补充",
    signals: profile.signals?.length
      ? profile.signals
      : [
          ["公开档案", "该人物来自公开领导班子名单，分析信号尚未生成。"],
          ["资料状态", "建议补充出生年月、任职时间、分管领域和官方来源链接。"],
        ],
    timeline: profile.timeline?.length ? profile.timeline : [["待补充", profile.title || "公开职务待补充"]],
    events: profile.events || [],
    sources: profile.sources?.length ? profile.sources : ["公开领导班子页面"],
  };
}

async function loadExternalProfiles() {
  try {
    // Try to load from API first
    const response = await apiFetch("/api/profiles", { cache: "no-store" });
    if (response.ok) {
      const apiProfiles = await response.json();
      if (Array.isArray(apiProfiles) && apiProfiles.length > 0) {
        profiles = mergeCustomProfiles(apiProfiles.map(normalizeProfile));
        console.log(`Loaded ${profiles.length} profiles from API`);
        return;
      }
    }
  } catch (error) {
    console.log("API not available, falling back to local file");
  }

  // Fallback to local file
  const response = await fetch("./data/leadership.json", { cache: "no-store" });
  if (!response.ok) return;
  const importedProfiles = await response.json();
  if (!Array.isArray(importedProfiles)) return;
  profiles = mergeCustomProfiles([...importedProfiles.map(normalizeProfile), ...profiles]);
}

function getFilteredProfiles() {
  const query = filterState.query.trim().toLowerCase();
  return profiles.filter((profile) => {
    const matchesRegion = filterState.region === "全部" || profile.region === filterState.region;
    const matchesSystem = filterState.system === "全部" || profile.system === filterState.system;
    const matchesAttention =
      filterState.attention === "全部" || profile.attention === filterState.attention;
    const eventText = profile.events.map((event) => `${event.type} ${event.title}`).join(" ");
    const haystack = `${profile.name} ${profile.region} ${profile.system} ${profile.title} ${profile.path} ${eventText}`.toLowerCase();
    return matchesRegion && matchesSystem && matchesAttention && haystack.includes(query);
  });
}

function renderSummary(filtered) {
  const avg = (key) =>
    filtered.length
      ? Math.round(filtered.reduce((total, profile) => total + profile[key], 0) / filtered.length)
      : 0;
  const highAttention = filtered.filter((profile) => profile.attention === "高").length;
  const pendingReview = filtered.filter((profile) => reviewStatus(profile)[0] !== "低关注").length;
  document.querySelector("#summaryGrid").innerHTML = [
    ["档案总量", filtered.length, "当前筛选范围内"],
    ["待评审", pendingReview, "中高关注档案"],
    ["高关注", highAttention, "需要优先核验"],
    ["事件均值", `${avg("eventRisk")}%`, "事故、案件、传言分层"],
  ]
    .map(
      ([label, value, note]) => `
        <div class="metric">
          <small>${label}</small>
          <strong>${value}</strong>
          <small>${note}</small>
        </div>
      `,
    )
    .join("");
}

function renderList(filtered) {
  resultCount.textContent = `${filtered.length} 条`;
  if (!filtered.length) {
    const query = (filterState.query || "").trim();
    if (query) {
      profileList.innerHTML = `
        <div class="empty-state">
          <p>未找到 "${escapeHtml(query)}" 的相关档案</p>
          <button class="btn-primary" id="addFromSearchBtn" style="margin-top:10px">＋ 添加 "${escapeHtml(query)}" 到档案库</button>
        </div>`;
      detailPane.innerHTML = `<div class="empty-state">可在左侧添加新官员</div>`;
      // 绑定点击
      setTimeout(() => {
        document.querySelector("#addFromSearchBtn")?.addEventListener("click", () => {
          setAddProfileName(query);
          openAddProfileDialog();
        });
      }, 0);
    } else {
      profileList.innerHTML = `<div class="empty-state">没有匹配的档案</div>`;
      detailPane.innerHTML = `<div class="empty-state">调整筛选条件后查看详情</div>`;
    }
    return;
  }

  if (!filtered.some((profile) => profile.id === filterState.selectedId)) {
    filterState.selectedId = filtered[0].id;
  }

  profileList.innerHTML = filtered
    .map(
      (profile) => {
        const [status, statusClass] = reviewStatus(profile);
        return `
        <button class="profile-card${profile.custom ? " is-custom" : ""}" type="button" data-profile-id="${profile.id}" aria-selected="${profile.id === filterState.selectedId}">
          <div class="profile-title-row">
            <span class="profile-name">${escapeHtml(profile.name)}</span>
            <span class="tag">${escapeHtml(profile.rank)}</span>
            ${profile.custom ? '<span class="tag custom">自定义</span>' : ""}
            <span class="tag ${statusClass}">${status}</span>
          </div>
          <p class="profile-meta">${escapeHtml(profile.title)}</p>
          <div class="review-line">
            <span>升迁 ${profile.promotion}</span>
            <span>事件 ${profile.eventRisk}</span>
            <span>舆论 ${(generateOpinionData(profile)).score}</span>
          </div>
          <div class="mini-bars" aria-hidden="true">
            <i style="--value: ${profile.promotion}%; --bar-color: var(--jade)"></i>
            <i style="--value: ${profile.eventRisk}%; --bar-color: ${scoreColor(profile.eventRisk)}"></i>
            <i style="--value: ${(generateOpinionData(profile)).score}%; --bar-color: ${scoreColor((generateOpinionData(profile)).score)}"></i>
          </div>
          <div class="tag-row">
            <span class="tag jade">${escapeHtml(profile.region)}</span>
            <span class="tag">${escapeHtml(profile.system)}</span>
            <span class="tag ${attentionClass(profile.attention)}">${escapeHtml(profile.attention)}关注</span>
          </div>
        </button>
      `;
      },
    )
    .join("");
}

function renderOpinionOverview(filtered) {
  const container = document.querySelector("#opinionOverviewGrid");
  const countEl = document.querySelector("#opinionCount");
  if (!container) return;

  const ranked = filtered
    .map(function (p) {
      const op = generateOpinionData(p);
      p._opinion = op;
      return p;
    })
    .sort(function (a, b) { return b._opinion.score - a._opinion.score; })
    .slice(0, 8);

  countEl.textContent = "舆论关注前 " + ranked.length + " 名";

  if (!ranked.length) {
    container.innerHTML = '<div class="empty-state">当前筛选条件下无舆论数据</div>';
    return;
  }

  container.innerHTML = ranked
    .map(function (p, idx) {
      const op = p._opinion;
      const trendCls = op.trend === "上升" ? "rose" : op.trend === "下降" ? "jade" : "amber";
      const trendIcon = op.trend === "上升" ? "↑" : op.trend === "下降" ? "↓" : "→";
      return '<div class="opinion-rank-card" data-profile-id="' + escapeHtml(p.id) + '">' +
        '<div class="or-rank">#' + (idx + 1) + '</div>' +
        '<div class="or-body">' +
          '<div class="or-name-row">' +
            '<strong>' + escapeHtml(p.name) + '</strong>' +
            '<span class="tag ' + attentionClass(p.attention) + '">' + escapeHtml(p.attention) + '关注</span>' +
          '</div>' +
          '<p class="or-title">' + escapeHtml(p.title) + '</p>' +
          '<div class="or-scores">' +
            '<span>舆论风险 <b style="color:' + scoreColor(op.score) + '">' + op.score + '</b></span>' +
            '<span class="tag ' + trendCls + '">' + trendIcon + ' ' + escapeHtml(op.trend) + '</span>' +
            '<span>事件 ' + p.events.length + ' 条</span>' +
          '</div>' +
          (op.affectedEvents.length ? '<div class="or-affected">' +
            '<span class="eyebrow">可能受影响事件</span>' +
            op.affectedEvents.slice(0, 2).map(function (ev) {
              return '<div class="or-aff-item">' +
                '<span class="tag ' + (ev.impact === "高" ? "rose" : ev.impact === "中" ? "amber" : "jade") + '">' + escapeHtml(ev.type) + '</span>' +
                '<span>' + escapeHtml(ev.title) + '</span>' +
              '</div>';
            }).join("") +
          '</div>' : '') +
        '</div>' +
      '</div>';
    })
    .join("");
}

const eventRadarState = {
  filter: "all",
  lastScanAt: null,
  scanning: false,
  cachedFeed: null,
  lastNewKeys: new Set(),
};

function eventItemKey(ev) {
  return (ev.url || ev.title || "").toLowerCase().trim();
}

function applyScanResultsToProfiles(results) {
  if (!Array.isArray(results)) return;
  for (const r of results) {
    if (!r.success || !r.profileId || !r.events) continue;
    const idx = profiles.findIndex((p) => p.id === r.profileId);
    const patch = { events: r.events, eventRisk: r.eventRisk };
    if (idx >= 0) {
      profiles[idx] = normalizeProfile({ ...profiles[idx], ...patch });
    }
  }
}

async function refreshEventFeedCache() {
  try {
    const res = await apiFetch("/api/events/feed", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    eventRadarState.cachedFeed = data.items || null;
    return eventRadarState.cachedFeed;
  } catch {
    return null;
  }
}

// 自动刷新事件雷达
let eventRadarTimer = null;
function startEventRadarAutoRefresh() {
  if (eventRadarTimer) return;
  eventRadarTimer = setInterval(async () => {
    const feed = await refreshEventFeedCache();
    if (feed) {
      renderEventRadar({ preserveStatus: true });
    }
  }, 30000); // 每30秒自动刷新
}
startEventRadarAutoRefresh();

// 自动刷新每日摘要（写入 #eventRadarFeed）
let dailySummaryTimer = null;
function startDailySummaryAutoRefresh() {
  if (dailySummaryTimer) return;
  renderTablePlus(); // 立即执行一次
  dailySummaryTimer = setInterval(() => renderTablePlus(), 15000); // 每15秒刷新
}
startDailySummaryAutoRefresh();

function buildEventFeedFromProfiles(profileList) {
  const items = [];
  for (const profile of profileList) {
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

function eventTypeClass(type) {
  if (type === "任免动向") return "jade";
  if (type === "反腐通报" || type === "重大事故") return "rose";
  if (type === "外事活动" || type === "表彰奖励") return "amber";
  return "";
}

function renderEventRadar(options = {}) {
  const statusEl = document.querySelector("#eventRadarStatus");
  const totalEl = document.querySelector("#eventTotalCount");
  const transitionEl = document.querySelector("#eventTransitionCount");
  const lastScanEl = document.querySelector("#eventLastScan");

  const feed =
    eventRadarState.cachedFeed?.length
      ? eventRadarState.cachedFeed
      : buildEventFeedFromProfiles(profiles);
  const transitionCount = feed.filter((e) => e.type === "任免动向").length;

  if (totalEl) totalEl.textContent = String(feed.length);
  if (transitionEl) transitionEl.textContent = String(transitionCount);
  if (lastScanEl) {
    lastScanEl.textContent = eventRadarState.lastScanAt
      ? new Date(eventRadarState.lastScanAt).toLocaleString("zh-CN", { hour: "2-digit", minute: "2-digit" })
      : "未扫描";
  }

  if (statusEl && !eventRadarState.scanning && eventRadarState.lastScanAt && !options.preserveStatus) {
    statusEl.textContent = `共 ${feed.length} 条事件，其中任免动向 ${transitionCount} 条`;
  }
}

async function runEventRadarScan(options = {}) {
  const statusEl = document.querySelector("#eventRadarStatus");
  const scanCurrentBtn = document.querySelector("#scanCurrentProfileBtn");
  const scanBatchBtn = document.querySelector("#scanBatchBtn");

  eventRadarState.scanning = true;
  if (statusEl) statusEl.textContent = "正在抓取官员变迁新闻，请稍候（每人约 3–8 秒）…";
  if (scanCurrentBtn) scanCurrentBtn.disabled = true;
  if (scanBatchBtn) scanBatchBtn.disabled = true;

  try {
    const body = {};
    if (options.profileId) body.profileId = options.profileId;
    if (options.limit) body.limit = options.limit;

    const response = await apiFetch("/api/events/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const raw = await response.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      if (raw.includes("Cannot POST") || raw.includes("<!DOCTYPE")) {
        throw new Error("事件雷达 API 未加载，请在项目目录执行 npm start 重启服务后重试");
      }
      throw new Error("服务器返回了无效数据，请重启服务后重试");
    }
    if (!response.ok) throw new Error(data.error || `扫描失败 (${response.status})`);

    const added = (data.results || []).reduce((sum, r) => sum + (r.eventsAdded || 0), 0);
    const errors = (data.results || []).filter((r) => r.error || r.success === false).length;

    eventRadarState.lastNewKeys = new Set();
    for (const r of data.results || []) {
      for (const ev of r.newEvents || []) {
        eventRadarState.lastNewKeys.add(eventItemKey(ev));
      }
    }

    applyScanResultsToProfiles(data.results);
    await loadExternalProfiles();
    applyScanResultsToProfiles(data.results);
    await refreshEventFeedCache();

    eventRadarState.lastScanAt = data.scannedAt || new Date().toISOString();

    const scannedIds = (data.results || []).map((r) => r.profileId).filter(Boolean);
    if (scannedIds.length) {
      filterState.region = "全部";
      filterState.system = "全部";
      filterState.attention = "全部";
      if (!profiles.some((p) => p.id === filterState.selectedId)) {
        filterState.selectedId = scannedIds[0];
      }
    }

    const filtered = getFilteredProfiles();
    renderSummary(filtered);
    renderList(filtered);
    renderEventRadar({ preserveStatus: true });
    renderOpinionOverview(filtered);

    const selected = profiles.find((p) => p.id === filterState.selectedId);
    if (selected) await renderDetail(selected);

    if (statusEl) {
      const totalInFeed = (eventRadarState.cachedFeed || buildEventFeedFromProfiles(profiles)).length;
      statusEl.textContent = `扫描完成：新增 ${added} 条事件，当前共 ${totalInFeed} 条${errors ? `（${errors} 人失败）` : ""}`;
    }
  } catch (error) {
    if (statusEl) statusEl.textContent = `扫描失败：${error.message}`;
  } finally {
    eventRadarState.scanning = false;
    if (scanCurrentBtn) scanCurrentBtn.disabled = false;
    if (scanBatchBtn) scanBatchBtn.disabled = false;
  }
}

async function renderDetail(profile) {
  const [status, statusClass] = reviewStatus(profile);
  renderDetailLoading(profile);

  let predictionData = null;
  try {
    const predResponse = await apiFetch(`/api/predict/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (predResponse.ok) predictionData = await predResponse.json();
  } catch (error) {
    console.log("Prediction API not available");
  }

  const insightHero = renderInsightHero(predictionData);

  detailPane.innerHTML = `
    <div class="detail-title-row">
      <div>
        <div class="person-name">${escapeHtml(profile.name)}</div>
        <p class="person-subtitle">${profile.age}岁 · ${escapeHtml(profile.region)} · ${escapeHtml(profile.system)} · ${escapeHtml(profile.rank)}</p>
        <p class="person-title-line">${escapeHtml(profile.title)}</p>
      </div>
      <span class="tag ${statusClass}">${status}</span>
    </div>

    ${insightHero}

    <div class="review-banner">
      <div>
        <span class="eyebrow">Review State</span>
        <strong>${sourceStatus(profile)} · ${profile.events.length} 条关联事件</strong>
      </div>
      <span class="tag ${attentionClass(profile.attention)}">${profile.attention}关注</span>
    </div>

    <div class="score-grid">
      ${[
        ["升迁窗口", profile.promotion],
        ["岗位变动", profile.mobility],
        ["事件雷达", profile.eventRisk],
        ["舆论风险", (generateOpinionData(profile)).score],
      ]
        .map(
          ([label, value]) => `
          <div class="score-card">
            <span>${label}</span>
            <div class="score-row"><strong>${value}</strong><small>/100</small></div>
            <div class="bar" style="--value: ${value}%; --bar-color: ${metricColor(label, value)}"><i></i></div>
          </div>
        `,
        )
        .join("")}
    </div>

    <div class="analysis-grid">
      <section class="signal-panel">
        <span class="eyebrow">Signals</span>
        ${profile.signals
          .map(
            ([title, copy]) => `
            <div class="signal-item">
              <strong>${escapeHtml(title)}</strong>
              <p class="signal-copy">${escapeHtml(copy)}</p>
            </div>
          `,
          )
          .join("")}
      </section>

      <section class="signal-panel">
        <span class="eyebrow">Event Radar</span>
        <div class="event-list">
          ${
            profile.events.length
              ? profile.events
                  .map(
                    (event) => `
              <div class="event-item">
                <div class="event-head">
                  <span class="tag ${event.impact === "高" ? "rose" : event.impact === "中" ? "amber" : "jade"}">${escapeHtml(event.type)}</span>
                  <time>${escapeHtml(event.date)}</time>
                </div>
                <strong>${escapeHtml(event.title)}</strong>
                <p>${escapeHtml(event.relation)}</p>
                <div class="event-foot">
                  <span>影响：${escapeHtml(event.impact)}</span>
                  <span>可信度：${escapeHtml(event.confidence)}</span>
                </div>
              </div>
            `,
                  )
                  .join("")
              : `<div class="empty-state">暂无已关联事件</div>`
          }
        </div>
      </section>
    </div>

    <div class="analysis-grid lower-grid">
      <section class="signal-panel">
        <span class="eyebrow">Timeline</span>
        <div class="timeline">
          ${profile.timeline
            .map(
              ([year, event]) => `
              <div class="timeline-item">
                <time>${escapeHtml(year)}</time>
                <p>${escapeHtml(event)}</p>
              </div>
            `,
            )
            .join("")}
        </div>
      </section>

      <section class="signal-panel guard-panel">
        <span class="eyebrow">Source Rules</span>
        <div class="signal-item">
          <strong>官方通报优先</strong>
          <p class="signal-copy">事故、处分、任免、会议报道以官方或原始发布为最高权重。</p>
        </div>
        <div class="signal-item">
          <strong>传言只作线索</strong>
          <p class="signal-copy">海外媒体、社交平台爆料必须标记为未核验，不参与事实性结论。</p>
        </div>
        <div class="signal-item">
          <strong>关联不等于责任</strong>
          <p class="signal-copy">同地、同系统、同企业事件只表示观察价值，不直接表示个人责任。</p>
        </div>
      </section>
    </div>

    ${(() => {
      const op = generateOpinionData(profile);
      const trendIcon = op.trend === "上升" ? "↑" : op.trend === "下降" ? "↓" : "→";
      const trendCls = op.trend === "上升" ? "rose" : op.trend === "下降" ? "jade" : "amber";
      return `
    <section class="opinion-panel" aria-label="舆论雷达">
      <div class="opinion-head">
        <div>
          <span class="eyebrow">Opinion Radar</span>
          <strong>舆论监测与事件影响评估</strong>
        </div>
        <div class="opinion-metrics">
          <div class="opinion-score-tag ${trendCls}">
            <span>舆论风险 ${op.score}</span>
            <span class="trend-arrow">${trendIcon} ${escapeHtml(op.trend)}</span>
          </div>
        </div>
      </div>

      <div class="opinion-body">
        <div class="opinion-signals">
          <span class="eyebrow">舆论信号</span>
          ${op.signals.map(([t, d]) => `
            <div class="opinion-signal-item ${t.includes("风险") || t.includes("敏感") || t.includes("聚焦") ? "alert" : ""}">
              <strong>${escapeHtml(t)}</strong>
              <p>${escapeHtml(d)}</p>
            </div>
          `).join("")}
        </div>

        <div class="opinion-events">
          <span class="eyebrow">可能受舆论影响的事件</span>
          ${op.affectedEvents.length
            ? op.affectedEvents.map((ev, i) => {
                const sensScore = (ev.impact === "高" ? 90 : ev.impact === "中" ? 55 : 25);
                const conf = ev.confidence || "";
                const unverified = conf.includes("未核验") || conf.includes("未交叉") || conf.includes("路边");
                return `
              <div class="opinion-event-card ${i === 0 ? "top-risk" : ""}">
                <div class="oe-header">
                  <div>
                    <span class="tag ${ev.impact === "高" ? "rose" : ev.impact === "中" ? "amber" : "jade"}">${escapeHtml(ev.type)}</span>
                    ${unverified ? '<span class="tag rose unverified-tag">待核验</span>' : ""}
                  </div>
                  <div class="oe-sensitivity">
                    <span class="eyebrow">舆论敏感度</span>
                    <strong style="color: ${sensScore >= 70 ? 'var(--rose)' : sensScore >= 40 ? 'var(--amber)' : 'var(--jade)'}">${sensScore}/100</strong>
                  </div>
                </div>
                <strong>${escapeHtml(ev.title)}</strong>
                <time>${escapeHtml(ev.date)}</time>
                <p>${escapeHtml(ev.relation)}</p>
                <div class="oe-foot">
                  <span>事件影响：${escapeHtml(ev.impact)}</span>
                  <span>可信度：${escapeHtml(ev.confidence)}</span>
                </div>
              </div>
            `;
              }).join("")
            : `<div class="empty-state">当前无关联事件</div>`
          }
        </div>
      </div>
    </section>
    `;
    })()}

    <section class="verify-panel" aria-label="来源校验">
      <span class="eyebrow">Source Verification</span>
      <p class="verify-intro">对关联事件的来源可信度进行人工判定</p>
      <div class="verify-grid">
        ${profile.events.map((ev, i) => {
          const isVerified = (ev.confidence || '').includes('已核验') || (ev.confidence || '').includes('已确认');
          const isFalse = (ev.confidence || '').includes('虚假');
          const stateCls = isVerified ? 'verified' : isFalse ? 'flagged' : '';
          return `
          <div class="verify-item ${stateCls}" data-event-idx="${i}" data-profile-id="${profile.id}">
            <span class="verify-ev-title">${escapeHtml((ev.title || '').substring(0, 40))}</span>
            <span class="verify-ev-type tag ${ev.impact === '高' ? 'rose' : ev.impact === '中' ? 'amber' : 'jade'}">${escapeHtml(ev.type)}</span>
            <div class="verify-btns">
              <button class="verify-btn verify-true ${isVerified ? 'active' : ''}" data-action="verify" data-idx="${i}" ${stateCls ? 'disabled' : ''}>✓ 真实</button>
              <button class="verify-btn verify-false ${isFalse ? 'active' : ''}" data-action="flag" data-idx="${i}" ${stateCls ? 'disabled' : ''}>✗ 虚假</button>
            </div>
          </div>
        `}).join('') || '<div class="empty-state">暂无关联事件</div>'}
      </div>
    </section>

    <div class="source-row">
      <span class="tag">数据源占位</span>
      ${profile.sources.map((source) => `<a href="#" aria-label="${escapeHtml(source)}">${escapeHtml(source)}</a>`).join("")}
    </div>

    ${predictionData && predictionData.recommendations?.length ? `
      <div class="recommendations-panel">
        <span class="eyebrow">AI 建议</span>
        ${predictionData.recommendations
          .map(
            (rec) => `
          <div class="recommendation-item ${rec.priority}">
            <span class="rec-priority">${rec.priority === "high" ? "高" : rec.priority === "medium" ? "中" : "低"}</span>
            <strong>${escapeHtml(rec.message)}</strong>
          </div>
        `,
          )
          .join("")}
      </div>
    ` : ""}
  `;
}

function render() {
  if (!filterState.selectedId && profiles.length) filterState.selectedId = profiles[0].id;
  createFilterButtons("#regionFilters", "region", getRegionFilters());
  createFilterButtons("#systemFilters", "system", getSystemFilters());
  createFilterButtons("#attentionFilters", "attention", attentionFilters);
  const filtered = getFilteredProfiles();
  renderSummary(filtered);
  renderList(filtered);
  const selected = profiles.find((profile) => profile.id === filterState.selectedId) || filtered[0];
  if (selected) void renderDetail(selected);
  renderSourcesPanel();
  renderEventRadar();
  renderOpinionOverview(filtered);
  renderTablePlus();
}

function randomInt(max) { return Math.floor(Math.random() * max); }

var marketStore = {};
function getMarketData(pid) {
  if (!marketStore[pid]) {
    var seed = Math.abs(hashStr(pid));
    var yes = Math.max(0.05, Math.min(0.95, 0.15 + (seed % 65) / 100));
    var vol = 8000 + (seed % 15000);
    marketStore[pid] = {
      yesPrice: yes, noPrice: 1 - yes, volume: vol,
      trend: Math.round((Math.random() - 0.5) * 12),
      traders: 20 + (seed % 80), comments: randomInt(15)
    };
  }
  return marketStore[pid];
}

function hashStr(s) {
  var h = 0; for (var i = 0; i < (s||'').length; i++) h = ((h << 5) - h) + s.charCodeAt(i); return h;
}

function getQuestion(p) {
  var n = p.name;
  if (/已被立案/.test(p.title||'')) return n + ' 已被中纪委立案审查';
  if (/已被带走|被留置/.test(p.title||'')) return n + ' 已被中纪委带走调查';
  if (/被约谈/.test(p.title||'')) return n + ' 在2026年内被正式立案调查？';
  return n + ' 在2026年内被中纪委调查？';
}

function renderSourcesPanel(profile) {
  var body = document.querySelector("#sourcesBody");
  if (!body) return;

  body.innerHTML = '<div class="empty-state">加载中…</div>';

  // 从 TablePlus MySQL 表 huairentang_events 读取数据
  apiFetch('/api/huairentang/events?limit=200').then(function (r) { return r.json(); }).then(function (events) {
    if (!Array.isArray(events) || !events.length) {
      body.innerHTML = '<div class="empty-state">暂无案件通报数据</div>';
      return;
    }

    // 筛选反腐通报类型的案件
    var caseEvents = events.filter(function (e) {
      return e.type === '反腐通报' || e.type === '落马通报' || (e.title || '').indexOf('被查') !== -1 || (e.title || '').indexOf('立案') !== -1;
    });

    if (!caseEvents.length) {
      body.innerHTML = '<div class="empty-state">暂无反腐通报案件</div>';
      return;
    }

    body.innerHTML =
    '<div class="market-header">' +
      '<h3 style="margin:0;font-size:18px">⚖ 中纪委案件通报</h3>' +
      '<p style="margin:4px 0 0;font-size:13px;color:var(--muted)">TablePlus · huairentang_events · ' + caseEvents.length + ' 条反腐通报</p>' +
    '</div>' +
    '<div class="case-list">' +
      caseEvents.map(function (e) {
        var impactClass = e.impact === '高' ? 'rose' : e.impact === '中' ? 'amber' : 'jade';
        var officialsList = (e.officials || []).map(function (name) {
          return '<span class="tag">' + escapeHtml(name) + '</span>';
        }).join(' ');

        return '<div class="case-card" data-url="' + escapeHtml(e.url || '') + '">' +
          '<div class="case-header">' +
            '<span class="tag ' + impactClass + '">' + escapeHtml(e.type) + '</span>' +
            '<time>' + escapeHtml(e.date || '') + '</time>' +
          '</div>' +
          '<div class="case-title">' + escapeHtml(e.title || '') + '</div>' +
          '<div class="case-summary">' + escapeHtml(e.summary || '') + '</div>' +
          '<div class="case-officials">' + officialsList + '</div>' +
          '<div class="case-footer">' +
            '<span class="case-source">来源：怀仁堂日报</span>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';

    // 点击卡片打开链接
    body.querySelectorAll('.case-card[data-url]').forEach(function (card) {
      card.addEventListener('click', function () {
        var url = this.dataset.url;
        if (url) {
          window.open(url, '_blank');
        }
      });
      card.style.cursor = 'pointer';
    });
  }).catch(function (error) {
    console.error('加载案件通报失败:', error);
    body.innerHTML = '<div class="empty-state">加载失败：请检查 /api/huairentang/events 与 TablePlus 数据库连接</div>';
  });
}

function renderHuairentangPanel() {
  var body = document.querySelector('#huairentangBody');
  if (!body) return;

  body.innerHTML = '<div class="empty-state">加载中…</div>';

  apiFetch('/api/huairentang/events?limit=100').then(function (r) { return r.json(); }).then(function (events) {
    if (!Array.isArray(events) || !events.length) {
      body.innerHTML = '<div class="empty-state">暂无怀仁堂日报数据</div>';
      return;
    }

    body.innerHTML =
      '<div class="market-header">' +
        '<h3 style="margin:0;font-size:18px">怀仁堂日报</h3>' +
        '<p style="margin:4px 0 0;font-size:13px;color:var(--muted)">TablePlus · huairentang_events · ' + events.length + ' 条</p>' +
      '</div>' +
      '<div class="case-list">' + events.map(function (event) {
        var officials = Array.isArray(event.officials)
          ? event.officials
          : String(event.officials || '').split(/[、,，;；\s]+/).filter(Boolean);
        var type = event.type || '怀仁堂日报';
        var impact = event.impact || (type === '反腐通报' ? '高' : '中');
        var typeColor = 'var(--muted)';
        if (type === '人事动向') typeColor = 'var(--jade)';
        if (type === '反腐通报') typeColor = 'var(--rose)';
        if (type === '外事活动') typeColor = 'var(--amber)';
        if (type === '重大事故') typeColor = 'var(--rose)';
        var impactClass = impact === '高' ? 'rose' : impact === '低' ? 'jade' : 'amber';

        return '<div class="case-card" data-url="' + escapeHtml(event.url || '') + '">' +
          '<div class="case-header">' +
            '<span class="case-type" style="color:' + typeColor + '">' + escapeHtml(type) + '</span>' +
            '<span class="tag ' + impactClass + '">影响 ' + escapeHtml(impact) + '</span>' +
            '<span class="case-date">' + escapeHtml(event.date || '') + '</span>' +
          '</div>' +
          '<h4 class="case-title">' + escapeHtml(event.title || '') + '</h4>' +
          '<p class="case-summary">' + escapeHtml(event.summary || '') + '</p>' +
          (officials.length ? '<div class="case-officials">涉及官员: ' + officials.map(function (o) { return '<span class="tag">' + escapeHtml(o) + '</span>'; }).join(' ') + '</div>' : '') +
          '<div class="case-footer">' +
            '<span class="case-source">来源：' + escapeHtml(event.source || '怀仁堂日报') + '</span>' +
            (event.url ? '<span>点击查看原文</span>' : '') +
          '</div>' +
        '</div>';
      }).join('') + '</div>';

    // 添加点击事件
    body.querySelectorAll('.case-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var url = this.dataset.url;
        if (url) window.open(url, '_blank');
      });
    });
  }).catch(function (error) {
    console.error('加载怀仁堂日报失败:', error);
    body.innerHTML = '<div class="empty-state">加载失败：请检查 /api/huairentang/events 与 TablePlus 数据库连接</div>';
  });
}

function renderMarketPanel() {
  var body = document.querySelector('#marketBody');
  if (!body) return;

  if (!userState.loggedIn) {
    body.innerHTML = '<div class="empty-state">请先在左侧登录后查看预测市场</div>';
    return;
  }

  body.innerHTML = '<div class="market-header"><h3 style="margin:0;font-size:18px">📊 中纪委预测市场</h3>' +
    '<p style="margin:4px 0 0;font-size:13px;color:var(--muted)">💰 余额: <strong style="color:var(--jade)">$' + userState.balance.toLocaleString() + '</strong> · 加载中…</p></div>' +
    '<div class="market-grid"><div class="empty-state">正在加载市场数据…</div></div>';

  // 同时加载 TablePlus 数据和结算结果
  Promise.all([
    apiFetch('/api/personnel-changes').then(function (r) { return r.json(); }),
    fetch('./data/market-results.json').then(function (r) { return r.json(); }).catch(function(){return {};})
  ]).then(function (results) {
    var rows = results[0];
    var marketResults = results[1];
    var globalSettlements = getGlobalSettlements();
    // 合并全局结算状态到 marketResults
    for (var mk in globalSettlements) {
      if (!marketResults[mk]) marketResults[mk] = globalSettlements[mk];
    }

    if (!Array.isArray(rows) || !rows.length) {
      body.innerHTML = '<div class="market-header"><h3>📊 中纪委预测市场</h3></div>' +
        '<div class="empty-state">TablePlus 暂无数据</div>';
      return;
    }

    // 只显示传闻/叫停状态的（非已确认）
    var rumorRows = rows.filter(function (r) {
      return r.status === '传闻' || r.status === '叫停' || r.status === '调查中' || !r.status;
    });

    if (!rumorRows.length) {
      body.innerHTML = '<div class="market-header"><h3>📊 中纪委预测市场</h3></div>' +
        '<div class="empty-state">暂无传闻阶段的人事变动</div>';
      return;
    }

    body.innerHTML =
      '<div class="market-header"><h3 style="margin:0;font-size:18px">📊 中纪委预测市场</h3>' +
      '<p style="margin:4px 0 0;font-size:13px;color:var(--muted)">💰 余额: <strong style="color:var(--jade)">$' + userState.balance.toLocaleString() + '</strong> · ' + rumorRows.length + ' 个市场</p></div>' +
      '<div class="market-grid">' + rumorRows.map(function (r) {
        var mkt = getMarketData('pc-' + r.id);
        var pct = Math.round(mkt.yesPrice * 100);
        var pid = 'pc-' + r.id;
        var yesPos = (userState.positions || {})[pid + '_yes'];
        var noPos = (userState.positions || {})[pid + '_no'];
        var hasPos = (yesPos && yesPos.amount > 0) || (noPos && noPos.amount > 0);
        var isLost = (yesPos && yesPos.lost) || (noPos && noPos.lost);
        var isSettled = (yesPos && yesPos.settled) || (noPos && noPos.settled);
        var result = marketResults[pid];
        var hasResult = result && result.result !== 'pending';
        var resultText = hasResult ? (result.result === 'confirmed' ? '✓ 已确认' : '✗ 已澄清') : '';
        var settledText = isSettled ? ((yesPos && yesPos.settledResult === 'confirmed') || (noPos && noPos.settledResult === 'confirmed') ? '✓ 已确认' : '✗ 已澄清') : '';

        var statusTags = [];
        if (yesPos && yesPos.amount > 0) {
          if (yesPos.settled) statusTags.push('<span class="tag jade">YES已结算</span>');
          else if (yesPos.lost) statusTags.push('<span class="tag rose">YES猜错</span>');
          else statusTags.push('<span class="tag jade">YES ' + yesPos.amount + '份</span>');
        }
        if (noPos && noPos.amount > 0) {
          if (noPos.settled) statusTags.push('<span class="tag jade">NO已结算</span>');
          else if (noPos.lost) statusTags.push('<span class="tag rose">NO猜错</span>');
          else statusTags.push('<span class="tag jade">NO ' + noPos.amount + '份</span>');
        }
        var statusTag = statusTags.join(' ');

        return '<div class="mkt-card' + (isLost ? ' lost' : '') + (hasResult || isSettled ? ' settled' : '') + '" data-pid="pc-' + r.id + '" data-name="' + escapeHtml(r.person_name) + '">' +
          '<div class="mkt-question">' + escapeHtml(r.person_name) + '：' + escapeHtml(r.original_position) + ' → ' + escapeHtml(r.new_position) + '</div>' +
          '<div class="mkt-subtitle" style="font-size:12px;color:var(--muted);margin-top:2px">' + escapeHtml(r.remarks || r.status || '') + (hasResult ? ' · ' + resultText : '') + (isSettled && !hasResult ? ' · ' + settledText : '') + '</div>' +
          (hasResult || isSettled ? '' : (isLost ? '' : '<div class="mkt-bar-wrap"><div class="mkt-bar" style="--pct:' + pct + '%"></div><span class="mkt-pct">' + pct + '%</span></div>' +
          '<div class="mkt-prices">' +
            '<div class="mkt-price yes' + (pct >= 50 ? ' lead' : '') + '"><span class="mkt-label">YES</span><span class="mkt-val">' + pct + '%</span></div>' +
            '<div class="mkt-price no' + (pct < 50 ? ' lead' : '') + '"><span class="mkt-label">NO</span><span class="mkt-val">' + (100 - pct) + '%</span></div>' +
          '</div>')) +
          '<div class="mkt-meta">' +
            '<span>👥 ' + mkt.traders + '</span><span>Vol ' + (mkt.volume / 1000).toFixed(1) + 'K</span>' +
            statusTag +
          '</div>' +
          (hasResult || isSettled ? '<div class="mkt-btns"><span style="font-size:12px;color:var(--muted)">已结算</span></div>' :
          (isLost ? '<div class="mkt-btns"><span style="font-size:12px;color:var(--muted)">已结算 - 猜错归零</span></div>' :
          '<div class="mkt-btns">' +
            '<button class="mkt-btn yes" data-id="pc-' + r.id + '" data-side="yes" data-name="' + escapeHtml(r.person_name) + '" data-event="' + escapeHtml(r.new_position) + '">Buy YES</button>' +
            '<button class="mkt-btn no" data-id="pc-' + r.id + '" data-side="no" data-name="' + escapeHtml(r.person_name) + '" data-event="' + escapeHtml(r.new_position) + '">Buy NO</button>' +
          '</div>')) +
        '</div>';
      }).join('') + '</div>';

    // 按钮事件
    body.querySelectorAll('.mkt-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var pid = this.dataset.id, side = this.dataset.side, name = this.dataset.name, eventDesc = this.dataset.event;
        var cost = 10;
        if (userState.balance < cost) { alert('余额不足！当前: $' + userState.balance); return; }
        userState.balance -= cost;
        if (!userState.positions) userState.positions = {};

        // 修改持仓数据结构，允许同时持有YES和NO
        var posKey = pid + '_' + side;
        if (!userState.positions[posKey]) {
          userState.positions[posKey] = { side: side, amount: 0, name: name, pid: pid, event: eventDesc || '' };
        }
        userState.positions[posKey].amount += 10;
        apiFetch('/api/market/trade', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ marketId:pid, personName:name, side:side, amount:10 }) }).catch(function(){});

        var mkt = getMarketData(pid);
        // 根据买入量调整概率，初始为50%
        var yesAmount = 0;
        var noAmount = 0;
        // 统计所有用户的持仓量（这里简化为只统计当前用户）
        for (var key in userState.positions) {
          if (key.startsWith(pid + '_yes')) yesAmount += userState.positions[key].amount;
          if (key.startsWith(pid + '_no')) noAmount += userState.positions[key].amount;
        }
        var totalAmount = yesAmount + noAmount;
        if (totalAmount > 0) {
          mkt.yesPrice = Math.max(0.01, Math.min(0.99, yesAmount / totalAmount));
        } else {
          mkt.yesPrice = 0.5;
        }
        mkt.noPrice = 1 - mkt.yesPrice;
        mkt.volume += 200 + randomInt(300); mkt.traders += 1; mkt.trend += (side === 'yes' ? 2 : -2);
        saveUser(); updateUserUI(); renderMarketPanel();
      });
    });

    // 卡片点击搜索对应官员
    body.querySelectorAll('.mkt-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var n = this.dataset.name;
        if (n) {
          filterState.query = n;
          render();
          document.querySelector('#profiles')?.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }).catch(function () {
    body.innerHTML = '<div class="market-header"><h3>📊 中纪委预测市场</h3></div><div class="empty-state">数据加载失败</div>';
  });
}

async function renderTablePlus() {
  try {
    const [pcRes, dsRes] = await Promise.all([
      apiFetch('/api/personnel-changes'),
      apiFetch('/api/daily-summary')
    ]);
    if (pcRes.ok) {
      const pc = await pcRes.json();
      document.querySelector('#personnelCount').textContent = pc.length + ' 条';
      document.querySelector('#personnelGrid').innerHTML = pc.map(r =>
        '<div class="tableplus-card">' +
          '<div class="tpc-header"><strong>' + escapeHtml(r.person_name) + '</strong><span class="tag ' + (r.status === '高可信' ? 'jade' : r.status === '叫停' ? 'rose' : 'amber') + '">' + escapeHtml(r.status) + '</span></div>' +
          '<p class="tpc-pos">' + escapeHtml(r.original_position) + ' → ' + escapeHtml(r.new_position) + '</p>' +
          '<div class="tpc-meta"><time>' + escapeHtml((r.date||'').split('T')[0]) + '</time><span>可信度: ' + escapeHtml(r.credibility) + '</span></div>' +
          (r.remarks ? '<p class="tpc-remark">' + escapeHtml(r.remarks) + '</p>' : '') +
        '</div>'
      ).join('') || '<div class="empty-state">暂无数据</div>';
    }

    const feedEl = document.querySelector('#eventRadarFeed');
    if (dsRes.ok) {
      const ds = await dsRes.json();
      document.querySelector('#dailyCount').textContent = ds.length + ' 条';
      const dailyHtml = ds.length
        ? ds.map(r =>
            '<div class="tableplus-card daily-card">' +
              '<div class="tpc-header"><time>' + escapeHtml((r.date||'').split('T')[0]) + '</time></div>' +
              '<strong>' + escapeHtml(r.main_line) + '</strong>' +
              (r.key_discussion ? '<p class="tpc-pos">' + escapeHtml(r.key_discussion) + '</p>' : '') +
              (r.notes ? '<p class="tpc-remark">' + escapeHtml(r.notes) + '</p>' : '') +
            '</div>'
          ).join('')
        : '<div class="empty-state">暂无每日摘要数据</div>';
      // 同时写入独立的每日摘要区块和事件雷达 feed 区域
      document.querySelector('#dailyGrid').innerHTML = dailyHtml;
      if (feedEl) feedEl.innerHTML = dailyHtml;
    } else {
      if (feedEl) feedEl.innerHTML = '<div class="empty-state">每日摘要暂不可用</div>';
    }
  } catch(e) {
    const feedEl = document.querySelector('#eventRadarFeed');
    if (feedEl) feedEl.innerHTML = '<div class="empty-state">加载失败，请检查服务是否运行</div>';
  }
}

document.addEventListener("click", (event) => {
  const filterButton = event.target.closest("[data-filter-key]");
  if (filterButton) {
    filterState[filterButton.dataset.filterKey] = filterButton.dataset.filterValue;
    render();
    return;
  }

  const profileButton = event.target.closest("[data-profile-id]");
  if (profileButton && !event.target.closest(".radar-event-link")) {
    filterState.selectedId = profileButton.dataset.profileId;
    const selected = profiles.find((p) => p.id === filterState.selectedId);
    if (selected) void renderDetail(selected);
    const filtered = getFilteredProfiles();
    renderList(filtered);
    renderSourcesPanel();
    renderEventRadar();
    renderOpinionOverview(filtered);
    return;
  }

  const radarCard = event.target.closest(".radar-event-card");
  if (radarCard && !event.target.closest(".radar-event-link")) {
    filterState.selectedId = radarCard.dataset.profileId;
    document.querySelector("#profiles")?.scrollIntoView({ behavior: "smooth" });
    const selected = profiles.find((p) => p.id === filterState.selectedId);
    if (selected) void renderDetail(selected);
    renderList(getFilteredProfiles());
  }
});

document.querySelector("#scanCurrentProfileBtn")?.addEventListener("click", () => {
  const id = filterState.selectedId || profiles[0]?.id;
  if (!id) {
    document.querySelector("#eventRadarStatus").textContent = "请先在左侧选择一名官员";
    return;
  }
  void runEventRadarScan({ profileId: id });
});

document.querySelector("#scanBatchBtn")?.addEventListener("click", () => {
  void runEventRadarScan({ limit: 15 });
});

document.querySelector("#eventRadarFilter")?.addEventListener("change", (e) => {
  eventRadarState.filter = e.target.value;
  renderEventRadar();
});

// Chain status bar
async function refreshChainStatus() {
  try {
    const [statsRes, htRes] = await Promise.all([
      apiFetch("/api/chain/stats"),
      apiFetch("/api/huairentang/events"),
    ]);
    if (statsRes.ok) {
      const stats = await statsRes.json();
      const pendingEl = document.querySelector("#chainPendingCount");
      const submittedEl = document.querySelector("#chainSubmittedCount");
      if (pendingEl) pendingEl.textContent = String(stats.pending ?? "—");
      if (submittedEl) submittedEl.textContent = String(stats.submitted ?? "—");
      updatePipelineState();
    }
    if (htRes.ok) {
      const ht = await htRes.json();
      const htEl = document.querySelector("#huairentangCount");
      if (htEl) htEl.textContent = String(ht.total ?? "—");
    }
  } catch (_) {}
}

// Telegram 聊天记录导入
document.querySelector("#telegramImportFile")?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const statusEl = document.querySelector("#eventRadarStatus");
  if (statusEl) statusEl.textContent = "正在读取聊天记录…";
  try {
    const text = await file.text();
    const exportData = JSON.parse(text);
    if (statusEl) statusEl.textContent = "正在解析并入队…";
    const res = await apiFetch("/api/telegram/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exportData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "导入失败");
    if (statusEl) statusEl.textContent = `导入完成：解析 ${data.parsed} 条，新入队 ${data.queued} 条（已去重）`;
    await refreshChainStatus();
  } catch (err) {
    if (statusEl) statusEl.textContent = "导入失败：" + err.message;
  }
  e.target.value = "";
});

// ===== 链上存证流水线动画 =====
function updatePipelineState() {
  var pipe = document.querySelector("#chainPipeline");
  if (!pipe) return;
  var pending = document.querySelector("#chainPendingCount");
  var count = pending ? parseInt(pending.textContent) || 0 : 0;
  pipe.className = "chain-pipeline" + (count > 0 ? " ready" : "");
}

function animatePipeline(txHashes) {
  var pipeline = document.querySelector("#chainPipeline");
  if (!pipeline) return;
  pipeline.className = "chain-pipeline active";
  pipeline.style.display = "block";

  const stages = [
    document.querySelector("#stageQueue"),
    document.querySelector("#stageHash"),
    document.querySelector("#stageSign"),
    document.querySelector("#stageChain"),
    document.querySelector("#stageDone"),
  ];
  const arrows = [
    document.querySelector("#arrow1"),
    document.querySelector("#arrow2"),
    document.querySelector("#arrow3"),
    document.querySelector("#arrow4"),
  ];
  const hashChars = "0123456789abcdef";
  function randomHash(len) {
    let h = "";
    for (let i = 0; i < len; i++) h += hashChars[Math.floor(Math.random() * 16)];
    return "0x" + h + "…";
  }

  // Reset
  stages.forEach(function (s) { s.className = "pipeline-stage"; });
  arrows.forEach(function (a) { a.className = "pipeline-arrow"; });
  document.querySelector("#pipelineTxHash").textContent = "";

  // Animate stages one by one
  const delay = 600;
  [0, 1, 2, 3, 4].forEach(function (i) {
    setTimeout(function () {
      if (i > 0) {
        stages[i - 1].className = "pipeline-stage done";
        if (arrows[i - 1]) arrows[i - 1].className = "pipeline-arrow flowing";
      }
      stages[i].className = "pipeline-stage processing";
      // pop a random hash on the arrow
      if (arrows[i]) {
        var hashEl = arrows[i].querySelector(".flow-hash");
        if (hashEl) {
          hashEl.textContent = randomHash(8);
          hashEl.className = "flow-hash animate";
          setTimeout(function () { hashEl.className = "flow-hash"; }, 1500);
        }
      }
    }, delay * i);
  });

  // Final: show tx hash
  setTimeout(function () {
    stages[4].className = "pipeline-stage done";
    arrows.forEach(function (a) { a.className = "pipeline-arrow flowing"; });
    var tx = document.querySelector("#pipelineTxHash");
    if (tx && txHashes.length > 0) {
      tx.innerHTML = "TX: <a href=\"https://sepolia.etherscan.io/tx/" + txHashes[0] + "\" target=\"_blank\">" + txHashes[0] + "</a>";
      tx.className = "pipeline-tx visible";
    }
  }, delay * 5 + 300);

  // 保持结果展示，30 秒后恢复
  setTimeout(function () {
    arrows.forEach(function (a) { a.className = "pipeline-arrow"; });
    pipeline.style.display = "";
    pipeline.className = pipeline.classList.contains("ready") ? "chain-pipeline ready" : "chain-pipeline";
  }, 30000);
}

document.querySelector("#submitChainBtn")?.addEventListener("click", async () => {
  const btn = document.querySelector("#submitChainBtn");
  const statusEl = document.querySelector("#eventRadarStatus");
  if (btn) btn.disabled = true;
  if (statusEl) statusEl.textContent = "⛓ 正在将事件哈希写入 Sepolia 链…";

  try {
    const res = await apiFetch("/api/chain/submit-now", { method: "POST" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "上链失败");
    if (statusEl) statusEl.textContent = "上链完成：成功 " + (data.submitted ?? 0) + " 条，失败 " + (data.failed ?? 0) + " 条";
    animatePipeline(data.txHashes || []);
    await refreshChainStatus();
  } catch (err) {
    if (statusEl) statusEl.textContent = "上链错误：" + err.message;
  } finally {
    if (btn) btn.disabled = false;
  }
});

// ===== 登录系统 =====
var userState = { name: '', balance: 1000, positions: {}, loggedIn: false };

function loadUser() {
  try {
    var s = localStorage.getItem('ccdi_user_' + userState.name);
    if (s) {
      userState = JSON.parse(s);
      return true;
    }
  } catch(e) {}
  return false;
}
function saveUser() {
  localStorage.setItem('ccdi_user_' + userState.name, JSON.stringify(userState));
}

function getGlobalSettlements() {
  try { return JSON.parse(localStorage.getItem('ccdi_market_settlements') || '{}'); } catch(e) { return {}; }
}

function saveGlobalSettlement(personName, result) {
  var s = getGlobalSettlements();
  s[personName] = { result: result, settledAt: new Date().toISOString() };
  localStorage.setItem('ccdi_market_settlements', JSON.stringify(s));
}

function checkMarketResults() {
  console.log('检查结算结果，用户名:', userState.name);
  console.log('用户持仓:', userState.positions);
  if (!userState.name || !userState.positions) return;
  var positions = userState.positions;
  fetch('./data/market-results.json').then(function (r) { return r.json(); }).catch(function(){return {}}).then(function (data) {
    console.log('结算数据:', data);
    if (!data) return;
    var settledPositions = [];
    for (var posKey in positions) {
      var pos = positions[posKey];
      console.log('检查持仓:', posKey, pos);
      if (!pos || !pos.name) continue;
      // 如果已经结算过，跳过
      if (pos.settled) continue;

      var result = data[pos.pid];
      console.log('持仓ID:', pos.pid, '持仓人名:', pos.name, '结算结果:', result);
      if (!result || result.result === 'pending') continue;

      var won = false;
      if (result.result === 'confirmed' && pos.side === 'yes') won = true;
      if (result.result === 'cleared' && pos.side === 'no') won = true;

      console.log('是否获胜:', won);
      // 标记为已结算
      pos.settled = true;
      pos.settledResult = result.result;
      pos.settledAt = result.resolvedAt || new Date().toISOString();
      settledPositions.push({
        personName: pos.name,
        side: pos.side,
        amount: pos.amount,
        result: result.result,
        won: won,
        settledAt: pos.settledAt
      });

      saveGlobalSettlement(pos.pid, result.result);
      if (won) {
        var profit = Math.round(pos.amount * (pos.credibilityRate || 0.5));
        userState.balance += pos.amount + profit;
        shootFireworks();
        setTimeout(function () {
          alert('🎉 猜中了！本金 $' + pos.amount + ' + 奖金 $' + profit + ' 到账');
          saveUser(); renderMarketPanel(); updateUserUI();
        }, 4000);
      } else {
        setTimeout(function () {
          alert('❌ 猜错了，持仓已锁定');
          saveUser(); renderMarketPanel(); updateUserUI();
        }, 1000);
      }
    }
    saveUser(); renderMarketPanel();

    // 上链结算结果
    if (settledPositions.length > 0) {
      console.log('上链结算结果:', settledPositions);
      apiFetch('/api/chain/settle-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settlements: settledPositions,
          userName: userState.name
        })
      }).then(function (r) { return r.json(); }).then(function (data) {
        console.log('上链成功:', data);
      }).catch(function (error) {
        console.error('上链失败:', error);
      });
    }
  });
}

// 烟花效果函数
function rand(a, b) { return Math.random() * (b - a) + a; }

function clearFireworksStage() {
  var stage = document.querySelector('#fireworksStage');
  if (stage) stage.innerHTML = '';
}

function addSpark(cx, cy, delay) {
  var stage = document.querySelector('#fireworksStage');
  if (!stage) return;

  var el = document.createElement('div');
  var size = rand(6, 14);
  var angle = rand(0, 360) * Math.PI / 180;
  var dist = rand(60, 200);
  var tx = Math.cos(angle) * dist;
  var ty = Math.sin(angle) * dist;
  var dur = rand(0.7, 1.3);
  var colors = ['#7F77DD', '#1D9E75', '#D85A30', '#D4537E', '#378ADD', '#EF9F27', '#E24B4A', '#97C459', '#5DCAA5', '#FAC775'];
  var color = colors[Math.floor(Math.random() * colors.length)];

  el.className = 'fireworks-spark';
  el.style.cssText = [
    'left:' + cx + 'px', 'top:' + cy + 'px',
    'width:' + size + 'px', 'height:' + size + 'px',
    'background:' + color,
    '--tx:' + tx + 'px', '--ty:' + ty + 'px',
    '--dur:' + dur + 's', '--delay:' + delay + 's',
  ].join(';');

  stage.appendChild(el);
  setTimeout(function () { el.remove(); }, (dur + delay) * 1000 + 100);
}

function shootFireworks() {
  var stage = document.querySelector('#fireworksStage');
  if (!stage) return;

  var wr = window.innerWidth;
  var hr = window.innerHeight;

  // 中心大爆炸
  for (var i = 0; i < 80; i++) addSpark(wr / 2, hr / 2, 0);

  // 四角小爆炸
  var spots = [
    { x: wr * 0.15, y: hr * 0.15 },
    { x: wr * 0.85, y: hr * 0.15 },
    { x: wr * 0.15, y: hr * 0.85 },
    { x: wr * 0.85, y: hr * 0.85 },
  ];
  spots.forEach(function (s, si) {
    for (var j = 0; j < 30; j++) addSpark(s.x, s.y, 0.3 + si * 0.18);
  });

  // 随机散射
  for (var k = 0; k < 6; k++) {
    var rx = rand(wr * 0.1, wr * 0.9);
    var ry = rand(hr * 0.1, hr * 0.9);
    for (var j = 0; j < 20; j++) addSpark(rx, ry, 0.6 + k * 0.2);
  }
}
function updateUserUI() {
  var nl = document.querySelector('#userNotLoggedIn'), lg = document.querySelector('#userLoggedIn');
  if (userState.loggedIn) {
    if (nl) nl.style.display = 'none'; if (lg) lg.style.display = 'flex';
    var dn = document.querySelector('#userDisplayName'), bal = document.querySelector('#userBalance'), pos = document.querySelector('#userPositions');
    var posList = document.querySelector('#userPositionList');
    if (dn) dn.textContent = userState.name;
    if (bal) bal.textContent = '$' + userState.balance.toLocaleString();
    if (pos) pos.textContent = Object.keys(userState.positions || {}).length;

    // 更新持仓列表（每个仓位独立显示，不按人名合并）
    if (posList) {
      var positions = userState.positions || {};
      var positionItems = Object.keys(positions).map(function (posKey) {
        var p = positions[posKey];
        if (!p || !p.name) return '';
        var settledClass = p.settled ? 'settled' : '';
        var settledText = p.settled ? (p.settledResult === 'confirmed' ? ' ✓' : ' ✗') : '';
        var sideClass = p.side === 'yes' ? 'side-yes' : 'side-no';
        var eventLabel = p.event ? ' → ' + escapeHtml(p.event) : '';
        return '<div class="user-position-item ' + settledClass + '">' +
          '<div class="upi-main">' + escapeHtml(p.name) + '<span style="font-size:10px;opacity:0.55">' + eventLabel + '</span>' + settledText + '</div>' +
          '<div class="upi-side">' +
            '<span class="' + sideClass + '">' + p.side.toUpperCase() + ' ' + p.amount + '份</span>' +
          '</div>' +
        '</div>';
      }).filter(Boolean).join('');

      if (positionItems) {
        posList.innerHTML = positionItems;
      } else {
        posList.innerHTML = '<div class="user-position-empty">暂无持仓</div>';
      }
    }
  } else {
    if (nl) nl.style.display = 'flex'; if (lg) lg.style.display = 'none';
  }
}

document.querySelector('#loginBtn')?.addEventListener('click', function () {
  var name = document.querySelector('#loginNameInput')?.value?.trim();
  if (!name) return;
  var tempState = { name: name };
  var saved = localStorage.getItem('ccdi_user_' + name);
  if (saved) {
    userState = JSON.parse(saved);
    userState.loggedIn = true;
  } else {
    userState = { name: name, balance: 1000, positions: {}, loggedIn: true };
  }
  localStorage.setItem('ccdi_last_user', name);
  saveUser(); updateUserUI(); renderMarketPanel(); checkMarketResults();
});
document.querySelector('#logoutBtn')?.addEventListener('click', function () {
  userState.loggedIn = false;
  localStorage.removeItem('ccdi_last_user');
  saveUser(); updateUserUI(); renderMarketPanel();
});
// 页面加载时自动恢复最后一个登录的用户
var lastUser = localStorage.getItem('ccdi_last_user');
if (lastUser) {
  var saved = localStorage.getItem('ccdi_user_' + lastUser);
  if (saved) {
    userState = JSON.parse(saved);
    userState.loggedIn = true;
    checkMarketResults();
  }
}
updateUserUI();
renderHuairentangPanel();

// 侧栏导航点击
document.querySelectorAll(".nav-item").forEach(function (item) {
  item.addEventListener("click", function (e) {
    e.preventDefault();
    var target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      // 高亮当前项
      document.querySelectorAll(".nav-item").forEach(function (n) { n.classList.remove("active"); });
      this.classList.add("active");
    }
  });
});

// 来源校验：真实/虚假按钮
document.addEventListener("click", async (event) => {
  const btn = event.target.closest(".verify-btn");
  if (!btn) return;
  event.stopPropagation();

  const action = btn.dataset.action;
  const evIdx = parseInt(btn.dataset.idx);
  const pid = btn.closest(".verify-item")?.dataset.profileId || filterState.selectedId;
  if (isNaN(evIdx) || !pid) return;

  const profile = profiles.find(p => p.id === pid);
  if (!profile || !profile.events || !profile.events[evIdx]) return;

  profile.events[evIdx].confidence = action === "verify" ? "已核验·人工确认" : "虚假信息·已标记";

  try {
    await apiFetch("/api/profiles/" + pid, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: profile.events })
    });
  } catch(e) {}

  renderDetail(profile);
});

searchInput.addEventListener("input", (event) => {
  filterState.query = event.target.value;
  const q = filterState.query.trim();
  // 按姓名精确匹配优先
  if (q) {
    const exact = profiles.find(p => p.name === q);
    if (exact) {
      filterState.selectedId = exact.id;
      filterState.region = "全部";
      filterState.system = "全部";
      filterState.attention = "全部";
      render();
      const el = document.querySelector('[data-profile-id="' + exact.id + '"]');
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  }
  render();
});

document.querySelector("#openAddProfileBtn")?.addEventListener("click", openAddProfileDialog);
document.querySelector("#closeAddProfileBtn")?.addEventListener("click", closeAddProfileDialog);
document.querySelector("#cancelAddProfileBtn")?.addEventListener("click", closeAddProfileDialog);
addProfileForm?.addEventListener("submit", handleAddProfileSubmit);

addProfileForm?.querySelectorAll('input[type="range"]').forEach((input) => {
  input.addEventListener("input", () => {
    const out = document.getElementById(input.dataset.output);
    if (out) out.textContent = input.value;
  });
});

loadExternalProfiles()
  .catch(() => {})
  .finally(async () => {
    await refreshEventFeedCache();
    render();
    refreshChainStatus().catch(() => {});
  });
