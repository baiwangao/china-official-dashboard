const crypto = require('crypto');

function canonicalize(event) {
  return JSON.stringify({
    title:  event.title  || '',
    date:   event.date   || '',
    source: event.source || '',
    url:    event.url    || '',
    type:   event.type   || '',
  });
}

function hashEvent(event) {
  const canonical = canonicalize(event);
  const hex = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
  return `0x${hex}`;
}

/**
 * 基于 URL + date 的去重键
 * 同一篇文章/链接不应该重复入库
 */
function sourceKey(event) {
  const url = (event.url || '').trim();
  const date = (event.date || '').trim();
  return url ? crypto.createHash('sha256').update(url + '|' + date, 'utf8').digest('hex').slice(0, 16) : null;
}

/**
 * 基于 title + date 的去重键（无 URL 时用）
 */
function titleKey(event) {
  const title = (event.title || '').trim().replace(/\s+/g, '');
  const date  = (event.date || '').trim();
  if (!title || !date) return null;
  return crypto.createHash('sha256').update(title + '|' + date, 'utf8').digest('hex').slice(0, 16);
}

module.exports = { hashEvent, canonicalize, sourceKey, titleKey };
