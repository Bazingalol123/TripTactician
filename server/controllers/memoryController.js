const Memory = require('../models/Memory');

// Create a new memory
exports.createMemory = async (req, res) => {
  try {
    const memory = new Memory({ ...req.body, user: req.user.id });
    await memory.save();
    res.status(201).json(memory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all memories for the authenticated user
exports.getMemories = async (req, res) => {
  try {
    const memories = await Memory.find({ user: req.user.id });
    res.json(memories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single memory by ID
exports.getMemoryById = async (req, res) => {
  try {
    const memory = await Memory.findOne({ _id: req.params.id, user: req.user.id });
    if (!memory) return res.status(404).json({ error: 'Memory not found' });
    res.json(memory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a memory
exports.updateMemory = async (req, res) => {
  try {
    const memory = await Memory.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!memory) return res.status(404).json({ error: 'Memory not found' });
    res.json(memory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a memory
exports.deleteMemory = async (req, res) => {
  try {
    const memory = await Memory.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!memory) return res.status(404).json({ error: 'Memory not found' });
    res.json({ message: 'Memory deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 
 