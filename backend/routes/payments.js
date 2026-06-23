const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

router.use(authMiddleware);

router.get('/', paymentController.getMyPayments);
router.post('/order', paymentController.createPaymentOrder);
router.post('/upi', paymentController.createUpiPayment);
router.put('/:paymentId/confirm', paymentController.confirmPayment);
router.get('/:paymentId/invoice', paymentController.downloadInvoice);

module.exports = router;
