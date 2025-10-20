const { buildVnPayUrl, signData } = require('./utils/vnpayHelper');
require('dotenv').config();
const crypto = require('crypto');

const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE;
const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET;
const VNPAY_URL = process.env.VNPAY_URL;
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT||3000}`;

function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

/**
 * Create a vnpay payment URL
 * amount: in VND cents? VNPay expects amount in smallest unit (i.e., 1000 -> 1000 VND). We'll pass amount as integer VND * 100? 
 * Note: VNPay expects amount in VND * 100 (i.e., 10000 => 1000000?), check VNPay docs. We'll assume amount in VND * 100.
 */
function createPaymentUrl({ order_no, amount, orderInfo = 'Payment', ipAddr }) {
  const tmnCode = VNPAY_TMN_CODE;
  const secret = VNPAY_HASH_SECRET;
  const vnpUrl = VNPAY_URL;
  const returnUrl = process.env.VNPAY_RETURN_URL || `${BASE_URL}/api/payments/vnpay_return`;
  const ip = ipAddr || '127.0.0.1';

  const createDate = new Date();
  const vnp_TxnRef = order_no;
  const vnp_OrderInfo = orderInfo;
  const vnp_OrderType = 'other';
  // VNPay expects amount in smallest currency unit: VND * 100 (so 10000 VND => 1000000)
  const vnp_Amount = amount * 100;

  const params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Amount: vnp_Amount.toString(),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: vnp_TxnRef,
    vnp_OrderInfo: vnp_OrderInfo,
    vnp_OrderType: vnp_OrderType,
    vnp_Locale: 'vn',
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ip,
    vnp_CreateDate: createDate.toISOString().replace(/[-:]/g, '').slice(0,14) // format YYYYMMDDhhmmss
  };

  return buildVnPayUrl(vnpUrl, params, secret);
}

/**
 * Verify VNPay secure hash for return or ipn
 * requestQuery is req.query
 */
function verifyReturnSignature(requestQuery) {
  const secret = VNPAY_HASH_SECRET;
  // vnp_SecureHash and vnp_SecureHashType may be present - remove them when building hash
  const input = { ...requestQuery };
  const receivedHash = input.vnp_SecureHash || input.vnp_SecureHash_V1;
  delete input.vnp_SecureHash;
  delete input.vnp_SecureHash_V1;
  delete input.vnp_SecureHashType;

  const sortedKeys = Object.keys(input).sort();
  const signDataStr = sortedKeys.map(k => `${k}=${input[k]}`).join('&');
  const calculated = crypto.createHmac('sha512', secret).update(signDataStr).digest('hex');
  return calculated === receivedHash;
}

module.exports = {
  createPaymentUrl,
  verifyReturnSignature
};
