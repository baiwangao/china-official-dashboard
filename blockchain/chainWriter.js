const queueManager = require('./queueManager');

let ethers, contractABI, contractAddress;

function isConfigured() {
  return Boolean(
    process.env.CHAIN_ENABLED === 'true' &&
    process.env.ALCHEMY_SEPOLIA_RPC &&
    process.env.ETH_PRIVATE_KEY &&
    process.env.CONTRACT_ADDRESS
  );
}

function loadDeps() {
  if (ethers) return true;
  try {
    ethers = require('ethers');
    const cfg = require('./contract.json');
    contractABI     = cfg.abi;
    contractAddress = process.env.CONTRACT_ADDRESS || cfg.address;
    return true;
  } catch (err) {
    console.warn('[ChainWriter] 依赖未就绪:', err.message);
    return false;
  }
}

function getContract() {
  const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_RPC);
  const wallet   = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, provider);
  return new ethers.Contract(contractAddress, contractABI, wallet);
}

/**
 * 检查哈希是否已在链上存证
 * @returns {boolean} true 表示已存在
 */
async function isAlreadyStored(hash) {
  if (!loadDeps()) return false;
  try {
    const contract = getContract();
    // 优先用本地队列去重，减少链上查询
    const local = await queueManager.getByHash(hash);
    if (local && local.status === 'submitted') return true;

    // 链上查询 getEvent
    const result = await contract.getEvent(hash);
    return result.exists;
  } catch {
    return false;
  }
}

/**
 * 提交前预过滤：去重 + 链上检查
 */
async function dedupBeforeSubmit(pendingItems) {
  const deduped = [];
  const seenHashes = new Set();
  const onChainCache = new Map(); // hash → bool

  for (const item of pendingItems) {
    // 1. 内存级去重（同一批次内）
    if (seenHashes.has(item.hash)) {
      console.log(`[ChainWriter] ⊘ 批内重复: ${item.hash.slice(0, 10)}…`);
      continue;
    }
    seenHashes.add(item.hash);

    // 2. 链上检查（批处理，每查过一个就缓存）
    if (!onChainCache.has(item.hash)) {
      const exists = await isAlreadyStored(item.hash);
      onChainCache.set(item.hash, exists);
    }
    if (onChainCache.get(item.hash)) {
      console.log(`[ChainWriter] ⊘ 链上已存: ${item.hash.slice(0, 10)}…`);
      // 同步本地队列：标记为已提交
      await queueManager.markSubmitted(item.queueId, 'on-chain-existing', null);
      continue;
    }

    deduped.push(item);
  }

  return deduped;
}

async function submitBatch(pendingItems) {
  if (!isConfigured()) {
    console.log('[ChainWriter] 未配置，跳过上链');
    return { submitted: 0, failed: 0, skipped: 0, txHashes: [] };
  }
  if (!loadDeps()) return { submitted: 0, failed: 0, skipped: 0, txHashes: [] };
  if (!pendingItems.length) return { submitted: 0, failed: 0, skipped: 0, txHashes: [] };

  // 去重
  const batch = await dedupBeforeSubmit(pendingItems);
  const skipped = pendingItems.length - batch.length;
  if (!batch.length) {
    console.log(`[ChainWriter] ${pendingItems.length} 条全部重复，跳过上链`);
    return { submitted: 0, failed: 0, skipped, txHashes: [] };
  }

  const contract  = getContract();
  const batchSize = Math.min(parseInt(process.env.CHAIN_BATCH_SIZE || '20', 10), batch.length);
  const toSubmit  = batch.slice(0, batchSize);
  const txHashes  = [];
  let submitted = 0, failed = 0;

  for (const item of toSubmit) {
    try {
      const tx = await contract.storeEventHash(item.hash, '');
      const receipt = await tx.wait(1);
      await queueManager.markSubmitted(item.queueId, tx.hash, receipt.blockNumber);
      txHashes.push(tx.hash);
      submitted++;
      console.log(`[ChainWriter] ✓ ${item.hash.slice(0, 10)}… → ${tx.hash}`);
    } catch (err) {
      const msg = err.reason || err.shortMessage || err.message;
      if (msg && msg.includes('Already stored')) {
        console.log(`[ChainWriter] ⊘ 合约层去重: ${item.hash.slice(0, 10)}…`);
        await queueManager.markSubmitted(item.queueId, 'on-chain-existing', null);
        skipped++;
      } else {
        console.error(`[ChainWriter] ✗ ${item.hash.slice(0, 10)}…:`, msg);
        await queueManager.markFailed(item.queueId);
        failed++;
      }
    }
    await new Promise(r => setTimeout(r, 300));
  }

  return { submitted, failed, skipped, txHashes };
}

async function getTotalStored() {
  if (!loadDeps()) return 0;
  try {
    const contract = getContract();
    const n = await contract.totalStored();
    return Number(n);
  } catch {
    return 0;
  }
}

module.exports = { submitBatch, getTotalStored, isConfigured, isAlreadyStored };
