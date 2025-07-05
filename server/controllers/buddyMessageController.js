const BuddyMessage = require('../models/BuddyMessage');

exports.createMessage = async (req, res) => {
  try {
    const message = await BuddyMessage.create({ ...req.body, userId: req.user._id });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create message', details: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.tripId) filter.tripId = req.query.tripId;
    const messages = await BuddyMessage.find(filter).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
}; 