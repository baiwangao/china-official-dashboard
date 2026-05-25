/**
 * 解析 Telegram 桌面客户端导出的 JSON 聊天记录（result.json）。
 * 导出方法：Telegram Desktop → 聊天 → 右上角菜单 → Export Chat History → JSON 格式
 */

function extractText(textField) {
  if (!textField) return '';
  if (typeof textField === 'string') return textField;
  if (Array.isArray(textField)) {
    return textField
      .map(part => (typeof part === 'string' ? part : (part.text || '')))
      .join('');
  }
  return String(textField);
}

function parseMediaType(msg) {
  if (msg.media_type) return msg.media_type;
  if (msg.photo)       return 'photo';
  if (msg.file)        return 'file';
  return null;
}

/**
 * 把 Telegram 导出 JSON 解析为统一消息格式。
 * @param {object} exportData  result.json 的完整内容
 * @returns {Array}
 */
function parseExport(exportData) {
  const messages = exportData.messages || [];
  const groupName = exportData.name || '未知群组';

  return messages
    .filter(m => m.type === 'message')
    .map(m => {
      const text = extractText(m.text);
      return {
        messageId:     m.id,
        date:          m.date || '',                     // ISO 字符串
        dateUnix:      Number(m.date_unixtime || 0),
        from:          m.from || m.actor || '匿名',
        fromId:        String(m.from_id || m.actor_id || ''),
        text:          text,
        mediaType:     parseMediaType(m),
        file:          m.file || null,
        photo:         m.photo || null,
        forwardFrom:   m.forwarded_from || null,         // 原频道/用户名
        forwardMsgId:  m.saved_from?.message_id || null,
        replyToId:     m.reply_to_message_id || null,
        views:         m.views || null,
        groupName,
        // 用于区块链哈希的规范字段（不含 views 等易变字段）
        source:        `Telegram:${groupName}`,
        title:         text.slice(0, 120) || `[${parseMediaType(m) || '消息'}]`,
        url:           '',
        type:          '群组消息',
      };
    });
}

module.exports = { parseExport };
