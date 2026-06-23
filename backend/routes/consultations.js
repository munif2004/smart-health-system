const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const consultationController = require('../controllers/consultationController');

router.use(authMiddleware);

router.get('/:roomId', consultationController.getConsultation);
router.put('/:roomId/read', consultationController.markMessagesRead);
router.put('/:roomId/end', consultationController.endConsultation);

module.exports = router;
