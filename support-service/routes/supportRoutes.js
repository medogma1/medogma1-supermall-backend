const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Ticket Routes
router.post('/tickets', supportController.createTicket);
router.get('/tickets/user', supportController.getUserTickets);
router.get('/tickets/:ticketId', supportController.getTicketDetails);
router.post('/tickets/:ticketId/reply', supportController.addTicketReply);
router.post('/tickets/:ticketId/close', supportController.closeTicket);

// FAQ Routes
router.get('/faqs', supportController.getFAQs);
router.post('/faqs', supportController.createFAQ);
router.put('/faqs/:faqId', supportController.updateFAQ);
router.delete('/faqs/:faqId', supportController.deleteFAQ);

module.exports = router;