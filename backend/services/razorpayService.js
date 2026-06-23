const crypto = require('crypto');
const axios = require('axios');

const toPaise = (amount) => Math.round(Number(amount || 0) * 100);

exports.createRazorpayOrder = async ({ amount, currency = 'INR', receipt }) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return {
      id: `mock_order_${Date.now()}`,
      amount: toPaise(amount),
      currency,
      receipt,
      status: 'created',
      mock: true
    };
  }

  const response = await axios.post('https://api.razorpay.com/v1/orders', {
    amount: toPaise(amount),
    currency,
    receipt,
    payment_capture: 1
  }, {
    auth: {
      username: keyId,
      password: keySecret
    },
    timeout: 15000
  });

  return response.data;
};

exports.verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return true;

  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return expectedSignature === signature;
};

exports.buildUpiPaymentData = ({ upiId, name, amount, transactionNote }) => {
  const params = new URLSearchParams({
    pa: upiId,
    pn: name || 'Hospital AI',
    am: String(amount || 0),
    cu: 'INR',
    tn: transactionNote || 'Healthcare consultation fee'
  });

  return `upi://pay?${params.toString()}`;
};
