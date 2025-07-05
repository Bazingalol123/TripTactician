const express = require('express');
const router = express.Router();
const memoryController = require('../controllers/memoryController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, memoryController.createMemory);
router.get('/', authMiddleware, memoryController.getMemories);
router.get('/:id', authMiddleware, memoryController.getMemoryById);
router.put('/:id', authMiddleware, memoryController.updateMemory);
router.delete('/:id', authMiddleware, memoryController.deleteMemory);

module.exports = router; 