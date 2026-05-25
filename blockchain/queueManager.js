const fs   = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { hashEvent, sourceKey, titleKey } = require('./hashService');

const QUEUE_FILE = path.join(__dirname, '../data/chain-queue.json');

const EMPTY_QUEUE = { pending: [], committed: [], submitted: [], failed: [] };

async function load() {
  try {
    const raw = await fs.readFile(QUEUE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { ...EMPTY_QUEUE };
  }
}

async function save(queue) {
  await fs.mkdir(path.dirname(QUEUE_FILE), { recursive: true });
  await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

/**
 * 将新事件数组入队。三层去重：
 * 1. 哈希去重（pending + committed + submitted + failed 四池）
 * 2. 源 URL 去重（同一篇文章不重复）
 * 3. 标题+日期去重（无 URL 时）
 * @returns {number} 实际新入队条数
 */
async function enqueue(events) {
  if (!events || !events.length) return 0;
  const queue = await load();

  // 收集所有已知哈希
  const knownHashes = new Set([
    ...queue.pending.map(i => i.hash),
    ...queue.committed.map(i => i.hash),
    ...queue.submitted.map(i => i.hash),
    ...queue.failed.map(i => i.hash),
  ]);

  // 收集所有已知源去重键
  const knownSourceKeys = new Set();
  const knownTitleKeys  = new Set();
  const allItems = [...queue.pending, ...queue.committed, ...queue.submitted, ...queue.failed];
  for (const item of allItems) {
    const ev = item.event || item;
    const sk = sourceKey(ev);
    const tk = titleKey(ev);
    if (sk) knownSourceKeys.add(sk);
    if (tk) knownTitleKeys.add(tk);
  }

  let added = 0, skippedHash = 0, skippedSource = 0;
  for (const event of events) {
    const hash = hashEvent(event);

    // 1. 哈希去重
    if (knownHashes.has(hash)) {
      skippedHash++;
      continue;
    }

    // 2. URL 去重
    const sk = sourceKey(event);
    if (sk && knownSourceKeys.has(sk)) {
      skippedSource++;
      continue;
    }

    // 3. 标题+日期去重
    const tk = titleKey(event);
    if (!sk && tk && knownTitleKeys.has(tk)) {
      skippedSource++;
      continue;
    }

    queue.pending.push({
      queueId:    crypto.randomUUID(),
      hash,
      event,
      sourceKey:  sk,
      titleKey:   tk,
      enqueuedAt: new Date().toISOString(),
      retries:    0,
    });
    knownHashes.add(hash);
    if (sk) knownSourceKeys.add(sk);
    if (tk) knownTitleKeys.add(tk);
    added++;
  }

  if (added > 0) await save(queue);
  if (skippedHash > 0 || skippedSource > 0) {
    console.log(`[QueueManager] 入队 ${added} 条，跳过 ${skippedHash + skippedSource} 条重复（哈希:${skippedHash} 源:${skippedSource}）`);
  }
  return added;
}

async function getPending() {
  const queue = await load();
  return queue.pending;
}

async function markCommitted(queueId, txHash, blockNumber) {
  const queue = await load();
  const idx = queue.pending.findIndex(i => i.queueId === queueId);
  if (idx === -1) return;
  const [item] = queue.pending.splice(idx, 1);
  queue.committed.push({
    queueId:     item.queueId,
    hash:        item.hash,
    txHash,
    blockNumber: blockNumber ?? null,
    committedAt: new Date().toISOString(),
  });
  await save(queue);
}

async function markSubmitted(queueId, txHash, blockNumber) {
  const queue = await load();
  let idx = queue.committed.findIndex(i => i.queueId === queueId);
  if (idx === -1) idx = queue.pending.findIndex(i => i.queueId === queueId);
  if (idx === -1) return;
  // 从找到的池移除
  const pool = queue.committed.findIndex(i => i.queueId === queueId) !== -1 ? queue.committed : queue.pending;
  const poolIdx = pool.findIndex(i => i.queueId === queueId);
  const [item] = pool.splice(poolIdx, 1);
  queue.submitted.push({
    queueId:     item.queueId,
    hash:        item.hash,
    txHash,
    blockNumber: blockNumber ?? null,
    submittedAt: new Date().toISOString(),
  });
  await save(queue);
}

async function markFailed(queueId) {
  const queue = await load();
  const idx = queue.pending.findIndex(i => i.queueId === queueId);
  if (idx === -1) return;
  queue.pending[idx].retries = (queue.pending[idx].retries || 0) + 1;
  if (queue.pending[idx].retries >= 3) {
    const [item] = queue.pending.splice(idx, 1);
    queue.failed.push({ ...item, failedAt: new Date().toISOString() });
  }
  await save(queue);
}

async function getStats() {
  const queue = await load();
  return {
    pending:   queue.pending.length,
    committed: queue.committed.length,
    submitted: queue.submitted.length,
    failed:    queue.failed.length,
  };
}

/**
 * 查询某哈希的本地状态（submitted池里查 txHash）
 */
async function getByHash(hash) {
  const queue = await load();
  const submitted = queue.submitted.find(i => i.hash === hash);
  if (submitted) return { status: 'submitted', ...submitted };
  const committed = queue.committed.find(i => i.hash === hash);
  if (committed) return { status: 'committed', ...committed };
  const pending = queue.pending.find(i => i.hash === hash);
  if (pending)   return { status: 'pending',   ...pending };
  return null;
}

module.exports = { enqueue, getPending, markCommitted, markSubmitted, markFailed, getStats, getByHash };
