const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const authMiddleware = require('../middleware/authMiddleware');

// FAQ Routes (public access)
router.get('/faq', supportController.getFAQs);
router.get('/faqs', supportController.getFAQs);

// Protected routes require authentication
router.use(authMiddleware);

// Ticket Routes
router.post('/tickets', supportController.createTicket);
router.get('/tickets', supportController.getAllTickets);
router.get('/tickets/user', supportController.getUserTickets);
router.get('/tickets/:ticketId', supportController.getTicketDetails);
router.put('/tickets/:ticketId', supportController.updateTicket);
router.post('/tickets/:ticketId/reply', supportController.addTicketReply);
router.post('/tickets/:ticketId/close', supportController.closeTicket);

// FAQ Management Routes (protected)
router.post('/faqs', supportController.createFAQ);
router.put('/faqs/:faqId', supportController.updateFAQ);
router.delete('/faqs/:faqId', supportController.deleteFAQ);

module.exports = router;