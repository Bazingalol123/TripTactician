const Friendship = require('../models/Friendship');

exports.sendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ error: 'friendId required' });
    const existing = await Friendship.findOne({ userId: req.user._id, friendId });
    if (existing) return res.status(400).json({ error: 'Request already sent' });
    const friendship = await Friendship.create({ userId: req.user._id, friendId });
    res.status(201).json(friendship);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send request', details: err.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const friendship = await Friendship.findOneAndUpdate(
      { _id: requestId, friendId: req.user._id, status: 'pending' },
      { status: 'accepted' },
      { new: true }
    );
    if (!friendship) return res.status(404).json({ error: 'Request not found' });
    res.json(friendship);
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept request' });
  }
};

exports.removeFriend = async (req, res) => {
  try {
    const { friendId } = req.body;
    await Friendship.deleteMany({
      $or: [
        { userId: req.user._id, friendId },
        { userId: friendId, friendId: req.user._id }
      ]
    });
    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove friend' });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const friends = await Friendship.find({
      $or: [
        { userId: req.user._id, status: 'accepted' },
        { friendId: req.user._id, status: 'accepted' }
      ]
    });
    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({ friendId: req.user._id, status: 'pending' });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
}; 