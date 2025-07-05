const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, activityController.createActivity);
router.get('/', authMiddleware, activityController.getActivities);
router.get('/:id', authMiddleware, activityController.getActivityById);
router.put('/:id', authMiddleware, activityController.updateActivity);
router.delete('/:id', authMiddleware, activityController.deleteActivity);

module.exports = router; 