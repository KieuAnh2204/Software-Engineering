const crypto = require('crypto');
const querystring = require('querystring');
const axios = require('axios');

// VNPAY Configuration
const vnpayConfig = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'YOUR_TMN_CODE',
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'YOUR_HASH_SECRET',
  vnp_Url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5001/api/payments/vnpay/callback',
};

// Sort object keys alphabetically
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach(key => {
    sorted[key] = obj[key];
  });
  return sorted;
}

// Create VNPAY payment URL
exports.createVNPayPayment = async (req, res, next) => {
  try {
    const { orderId, amount, orderInfo, returnUrl } = req.body;

    if (!orderId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'orderId and amount are required',
      });
    }

    const date = new Date();
    const createDate = date.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
    const expireDate = new Date(date.getTime() + 15 * 60 * 1000)
      .toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14);

    const ipAddr = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   '127.0.0.1';

    let vnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo || `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // VNPAY expects amount in smallest currency unit (VND * 100)
      vnp_ReturnUrl: returnUrl || vnpayConfig.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Sort parameters
    vnpParams = sortObject(vnpParams);

    // Create signature
    const signData = querystring.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnpParams.vnp_SecureHash = signed;

    // Create payment URL
    const paymentUrl = vnpayConfig.vnp_Url + '?' + querystring.stringify(vnpParams, { encode: false });

    res.json({
      success: true,
      paymentUrl,
      orderId,
    });
  } catch (error) {
    console.error('VNPAY payment creation error:', error);
    next(error);
  }
};

// Handle VNPAY callback (IPN - Instant Payment Notification)
exports.vnpayCallback = async (req, res, next) => {
  try {
    let vnpParams = req.query;
    const secureHash = vnpParams.vnp_SecureHash;

    // Remove hash params
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    // Sort parameters
    vnpParams = sortObject(vnpParams);

    // Verify signature
    const signData = querystring.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      return res.status(400).json({
        success: false,
        message: 'Invalid signature',
        RspCode: '97',
      });
    }

    const orderId = vnpParams.vnp_TxnRef;
    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionNo = vnpParams.vnp_TransactionNo;
    const amount = vnpParams.vnp_Amount / 100; // Convert back from smallest unit

    // Update order payment status via Order Service
    try {
      const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:3002';
      const paymentStatus = responseCode === '00' ? 'paid' : 'failed';

      await axios.put(
        `${orderServiceUrl}/api/orders/${orderId}/payment-status`,
        {
          payment_status: paymentStatus,
          transaction_id: transactionNo,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // For frontend redirect
      if (responseCode === '00') {
        return res.redirect(`${process.env.FRONTEND_URL}/order/payment-success?orderId=${orderId}`);
      } else {
        return res.redirect(`${process.env.FRONTEND_URL}/order/payment-failed?orderId=${orderId}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Error updating order status',
        RspCode: '99',
      });
    }
  } catch (error) {
    console.error('VNPAY callback error:', error);
    next(error);
  }
};

// Query payment status from VNPAY
exports.queryPaymentStatus = async (req, res, next) => {
  try {
    const { orderId, transDate } = req.query;

    if (!orderId || !transDate) {
      return res.status(400).json({
        success: false,
        message: 'orderId and transDate are required',
      });
    }

    const date = new Date();
    const requestId = date.getTime().toString();
    const createDate = date.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

    let vnpParams = {
      vnp_RequestId: requestId,
      vnp_Version: '2.1.0',
      vnp_Command: 'querydr',
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Truy van giao dich ${orderId}`,
      vnp_TransactionDate: transDate,
      vnp_CreateDate: createDate,
      vnp_IpAddr: req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1',
    };

    // Sort and create signature
    vnpParams = sortObject(vnpParams);
    const signData = querystring.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnpParams.vnp_SecureHash = signed;

    // Query VNPAY API
    const vnpayApiUrl = process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
    const response = await axios.post(vnpayApiUrl, vnpParams);

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error('VNPAY query error:', error);
    next(error);
  }
};

// Refund transaction
exports.refundTransaction = async (req, res, next) => {
  try {
    const { orderId, amount, transactionNo, transDate, createBy } = req.body;

    if (!orderId || !amount || !transactionNo || !transDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const date = new Date();
    const requestId = date.getTime().toString();
    const createDate = date.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);

    let vnpParams = {
      vnp_RequestId: requestId,
      vnp_Version: '2.1.0',
      vnp_Command: 'refund',
      vnp_TmnCode: vnpayConfig.vnp_TmnCode,
      vnp_TransactionType: '02', // Full refund
      vnp_TxnRef: orderId,
      vnp_Amount: amount * 100,
      vnp_OrderInfo: `Hoan tien giao dich ${orderId}`,
      vnp_TransactionNo: transactionNo,
      vnp_TransactionDate: transDate,
      vnp_CreateDate: createDate,
      vnp_CreateBy: createBy || 'admin',
      vnp_IpAddr: req.headers['x-forwarded-for'] || req.connection.remoteAddress || '127.0.0.1',
    };

    // Sort and create signature
    vnpParams = sortObject(vnpParams);
    const signData = querystring.stringify(vnpParams, { encode: false });
    const hmac = crypto.createHmac('sha512', vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnpParams.vnp_SecureHash = signed;

    // Call VNPAY refund API
    const vnpayApiUrl = process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
    const response = await axios.post(vnpayApiUrl, vnpParams);

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    console.error('VNPAY refund error:', error);
    next(error);
  }
};
