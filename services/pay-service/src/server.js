const express = require('express')
const app = express()
const port = 3000

const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat} = require('vnpay');

app.post('/api/create-qr', async (req, res) => {
    const vnpay = new VNPay({
        tmnCode: 'YBI06X9N',
        secureSecret: 'VSKKEZZP1UU9D5OB5D7ABG1XAVO1D2N7',
        vnpayHost: 'https://sandbox.vnpayment.vn',
        testMode: true,
        hashAlgorithm: 'SHA512',
        loggerFn: ignoreLogger,
    })

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const vnpayResponse = await vnpay.buildPaymentUrl({
        vnp_Amount: 100000,
        vnp_IpAddr: '127.0.0.1',
        vnp_TxnRef: '234567',
        vnp_OrderInfo: '123456',
        vnp_OrderType: ProductCode.Other,
        vnp_ReturnUrl: 'http://localhost:3000/api/check-payment-vnpay',
        vnp_Locale: VnpLocale.VN,
        vnp_CreateDate: dateFormat(new Date()),
        vnp_ExpireDate: dateFormat(tomorrow),
        
    });

    return res.status(201).json(vnpayResponse)
}
)

app.get('/api/check-payment-vnpay', (req, res) => {
    console.log(req.query)
}
)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
