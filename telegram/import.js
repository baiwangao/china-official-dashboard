#!/usr/bin/env node
/**
 * CLI 导入脚本
 * 用法: node telegram/import.js <path-to-result.json> [--dry-run]
 *
 * 示例:
 *   node telegram/import.js ~/Downloads/ChatExport/result.json
 *   node telegram/import.js ~/Downloads/ChatExport/result.json --dry-run
 */

const fs       = require('fs');
const path     = require('path');
const { parseExport } = require('./parseExport');
const queueManager   = require('../blockchain/queueManager');

async function main() {
  const args    = process.argv.slice(2);
  const dryRun  = args.includes('--dry-run');
  const filePath = args.find(a => !a.startsWith('--'));

  if (!filePath) {
    console.error('用法: node telegram/import.js <result.json> [--dry-run]');
    process.exit(1);
  }

  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error('文件不存在:', absPath);
    process.exit(1);
  }

  const raw  = fs.readFileSync(absPath, 'utf8');
  const data = JSON.parse(raw);

  const messages = parseExport(data);
  console.log(`\n✓ 解析完成：共 ${messages.length} 条消息`);

  // 统计摘要
  const mediaCount   = messages.filter(m => m.mediaType).length;
  const forwardCount = messages.filter(m => m.forwardFrom).length;
  console.log(`  · 含媒体：${mediaCount} 条`);
  console.log(`  · 含转发：${forwardCount} 条`);

  if (dryRun) {
    console.log('\n[dry-run] 未写入队列，退出。');
    console.log('前3条消息预览:');
    messages.slice(0, 3).forEach(m => {
      console.log(`  [${m.date}] ${m.from}: ${m.title}`);
    });
    return;
  }

  process.env.QUEUE_FILE = process.env.QUEUE_FILE ||
    path.join(__dirname, '../data/chain-queue.json');

  const queued = await queueManager.enqueue(messages);
  console.log(`\n✓ 入队完成：新增 ${queued} 条（已去重）`);

  const stats = await queueManager.getStats();
  console.log(`  待上链：${stats.pending}，已上链：${stats.submitted}，失败：${stats.failed}`);
  console.log('\n下一步：启动服务器后，执行 POST /api/chain/submit-now 提交上链。');
}

main().catch(err => {
  console.error('导入失败:', err.message);
  process.exit(1);
});
