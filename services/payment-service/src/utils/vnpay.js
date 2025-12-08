const crypto = require('crypto');
const querystring = require('querystring');

const VNP_VERSION = '2.1.0';
const VNP_COMMAND_PAY = 'pay';

const config = {
  tmnCode: process.env.VNPAY_TMN_CODE || '',
  hashSecret: process.env.VNPAY_HASH_SECRET || '',
  paymentUrl:
    process.env.VNPAY_PAYMENT_URL ||
    process.env.VNPAY_API_URL ||
    'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl:
    process.env.VNPAY_RETURN_URL ||
    'http://localhost:3000/payment/vnpay/return',
  ipnUrl: process.env.VNPAY_IPN_URL || '',
};

const toVNPayDate = (date = new Date()) =>
  date.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

const sortObject = (obj) => {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((k) => {
      sorted[k] = obj[k];
    });
  return sorted;
};

/**
 * Build a VNPAY payment URL
 * @param {object} params
 * @param {string} params.vnp_TxnRef - unique transaction ref (per payment)
 * @param {number} params.amount - amount in VND (integer)
 * @param {string} params.orderInfo - description
 * @param {string} [params.ipAddr] - client IP
 * @param {string} [params.bankCode] - optional bank code
 * @param {string} [params.returnUrl] - override return URL
 * @param {number} [params.expireMinutes] - minutes until expiration
 */
function buildPaymentUrl({
  vnp_TxnRef,
  amount,
  orderInfo,
  ipAddr = '127.0.0.1',
  bankCode,
  returnUrl,
  expireMinutes = 15,
}) {
  const createDate = toVNPayDate(new Date());
  const expireDate = toVNPayDate(
    new Date(Date.now() + expireMinutes * 60 * 1000)
  );

  const params = {
    vnp_Version: VNP_VERSION,
    vnp_Command: VNP_COMMAND_PAY,
    vnp_TmnCode: config.tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef,
    vnp_OrderInfo: orderInfo || `Thanh toan don hang ${vnp_TxnRef}`,
    vnp_OrderType: 'other',
    vnp_Amount: Math.round(Number(amount) * 100), // VND * 100
    vnp_ReturnUrl: returnUrl || config.returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };
  if (bankCode) params.vnp_BankCode = bankCode;
  // Note: IPN URL is configured in the VNPAY portal; do not send vnp_IpnUrl here.

  const sorted = sortObject(params);
  const signData = querystring.stringify(sorted, { encode: false });
  const hmac = crypto.createHmac('sha512', config.hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  sorted.vnp_SecureHash = signed;

  const paymentUrl =
    config.paymentUrl +
    '?' +
    querystring.stringify(sorted, { encode: false });

  return { paymentUrl, params: sorted };
}

/**
 * Verify return/IPN params from VNPAY
 * @param {object} queryOrBody
 * @returns {{ valid: boolean, cleaned: object, secureHash: string }}
 */
function verifyParams(queryOrBody) {
  const incoming = { ...queryOrBody };
  const secureHash = incoming.vnp_SecureHash;
  delete incoming.vnp_SecureHash;
  delete incoming.vnp_SecureHashType;

  const sorted = sortObject(incoming);
  const signData = querystring.stringify(sorted, { encode: false });
  const hmac = crypto.createHmac('sha512', config.hashSecret);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return { valid: secureHash === signed, cleaned: sorted, secureHash };
}

module.exports = { buildPaymentUrl, verifyParams, config };
