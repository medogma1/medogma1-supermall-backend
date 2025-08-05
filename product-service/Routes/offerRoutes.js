const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const { authenticate } = require('../middleware/authMiddleware');

// مسارات العروض الأساسية
router.post('/', authenticate, offerController.createOffer);
router.get('/', offerController.getAllOffers);

// Admin routes
router.get('/admin/offers', authenticate, offerController.getAllOffers);
router.post('/admin/offers', authenticate, offerController.createOffer);
router.get('/admin/offers/:id', authenticate, offerController.getOfferById);
router.put('/admin/offers/:id', authenticate, offerController.updateOffer);
router.delete('/admin/offers/:id', authenticate, offerController.deleteOffer);
router.patch('/admin/offers/:id/toggle', authenticate, offerController.toggleOfferStatus);

// مسارات التحقق والتطبيق
router.post('/validate/:code', offerController.validateOffer);
router.post('/apply/:code', authenticate, offerController.applyOffer);

// مسارات العرض المحددة
router.get('/:id', offerController.getOfferById);
router.put('/:id', authenticate, offerController.updateOffer);
router.delete('/:id', authenticate, offerController.deleteOffer);

module.exports = router;