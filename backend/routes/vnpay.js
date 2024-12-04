const express = require('express');
const router = express.Router();
const moment = require('moment');
const qs = require('qs');
const crypto = require('crypto');
const config = require('config');

// Hàm sắp xếp tham số theo thứ tự bảng chữ cái
const sortObject = (obj) => {
  const sorted = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = obj[key];
    });
  return sorted;
};

// Endpoint tạo URL thanh toán
router.post('/create_payment_url', (req, res) => {
  try {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const ipAddr =
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress;

    const tmnCode = config.get('vnp_TmnCode');
    const secretKey = config.get('vnp_HashSecret');
    const vnpUrl = config.get('vnp_Url');
    const returnUrl = config.get('vnp_ReturnUrl');

    const orderId = moment(date).format('DDHHmmss');
    const amount = req.body.amount; // Số tiền thanh toán
    const bankCode = req.body.bankCode || ''; // Mã ngân hàng (nếu có)
    const locale = req.body.language || 'vn'; // Ngôn ngữ (mặc định là 'vn')

    const vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toán cho mã GD: ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // Số tiền phải nhân với 100
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    };

    if (bankCode) vnp_Params['vnp_BankCode'] = bankCode;

    // Sắp xếp tham số
    const sortedParams = sortObject(vnp_Params);

    // Tạo chuỗi dữ liệu để tạo chữ ký
    const signData = qs.stringify(sortedParams, { encode: false });

    // Tạo chữ ký HMAC SHA512
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Thêm chữ ký vào tham số
    vnp_Params['vnp_SecureHash'] = signed;

    // Tạo URL thanh toán
    const paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: true });

    res.status(200).json({ paymentUrl });
  } catch (error) {
    console.error('Error creating payment URL:', error);
    res.status(500).send('Có lỗi xảy ra khi tạo URL thanh toán.');
  }
});

// Endpoint xử lý trả về từ VNPay
router.get('/vnpay_return', (req, res) => {
  try {
    let vnp_Params = req.query;
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sắp xếp tham số
    vnp_Params = sortObject(vnp_Params);

    // Tạo chuỗi dữ liệu để kiểm tra chữ ký
    const signData = qs.stringify(vnp_Params, { encode: false });
    const secretKey = config.get('vnp_HashSecret');
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash === signed) {
      const orderStatus = vnp_Params['vnp_ResponseCode'] === '00' ? 'success' : 'error';
      if (orderStatus === 'success') {
        res.redirect(config.get('FRONTEND_URL') + '/payment-success');
      } else {
        res.redirect(config.get('FRONTEND_URL') + '/payment-error');
      }
    } else {
      res.status(400).send('Chữ ký không hợp lệ!');
    }
  } catch (error) {
    console.error('Error processing VNPay return:', error);
    res.status(500).send('Có lỗi xảy ra khi xử lý thông tin trả về từ VNPay.');
  }
});

module.exports = router;
