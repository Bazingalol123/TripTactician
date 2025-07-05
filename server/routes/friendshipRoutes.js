const express = require('express');
const router = express.Router();
const friendshipController = require('../controllers/friendshipController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/request', authMiddleware, friendshipController.sendRequest);
router.post('/accept', authMiddleware, friendshipController.acceptRequest);
router.post('/remove', authMiddleware, friendshipController.removeFriend);
router.get('/', authMiddleware, friendshipController.getFriends);
router.get('/requests', authMiddleware, friendshipController.getRequests);

module.exports = router; 