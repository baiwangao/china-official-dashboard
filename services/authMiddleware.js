const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'change-me-in-production';

// token 有效期：2 小时
const TOKEN_TTL_SECONDS = 7200;

// 🔑 核心：签名 = HMAC-SHA256( secret, payload字符串 )
function signPayload(payloadStr) {
  return crypto.createHmac('sha256', SECRET)
    .update(payloadStr)
    .digest('hex');
}

// ✅ 生成 token：格式 "payload时间戳.signature"
function generateToken(payload) {
  const envelope = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),        // issued at
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS, // 过期
  };
  const jsonStr = JSON.stringify(envelope);
  const signature = signPayload(jsonStr);
  // 用 base64 编码 payload，方便肉眼区分（不加密，只是编码）
  const b64 = Buffer.from(jsonStr).toString('base64url');
  return `${b64}.${signature}`;
}

// 🔍 验证 token
function verifyToken(token) {
  try {
    const [b64, signature] = token.split('.');
    if (!b64 || !signature) return null;

    // 1. 还原 payload
    const jsonStr = Buffer.from(b64, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr);

    // 2. 重算签名对比（防篡改）
    const expectedSig = signPayload(jsonStr);
    if (signature !== expectedSig) return null;

    // 3. 检查过期时间
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

// 🔐 中间件
function authRequired(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) return res.status(401).json({ error: 'Missing token' });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });

  req.user = payload;
  next();
}

module.exports = { generateToken, verifyToken, authRequired };