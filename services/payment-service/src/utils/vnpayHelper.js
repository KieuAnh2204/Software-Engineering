const crypto = require('crypto');
const querystring = require('querystring');

/**
 * Create secure hash (HMAC SHA512) as VNPay expects.
 */
function signData(secret, data) {
  return crypto.createHmac('sha512', secret).update(data).digest('hex');
}

/**
 * Build VNPay payment URL
 * - params: object of vnp_ parameters
 * - vnpUrl: base url from VNPay
 */
function buildVnPayUrl(vnpUrl, params, hashSecret) {
  // Sort params by key
  const sortedKeys = Object.keys(params).sort();
  const signDataStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
  const secureHash = signData(hashSecret, signDataStr);
  const query = querystring.stringify(params, { encode: true });
  return `${vnpUrl}?${query}&vnp_SecureHash=${secureHash}`;
}

module.exports = {
  signData,
  buildVnPayUrl
};
