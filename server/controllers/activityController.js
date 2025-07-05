const Activity = require('../models/Activity');

exports.createActivity = async (req, res) => {
  try {
    const activity = await Activity.create({ ...req.body, userId: req.user._id });
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create activity', details: err.message });
  }
};

exports.getActivities = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.tripId) filter.tripId = req.query.tripId;
    const activities = await Activity.find(filter);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};

exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findOne({ _id: req.params.id, userId: req.user._id });
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
};

exports.updateActivity = async (req, res) => {
  try {
    const activity = await Activity.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update activity' });
  }
};

exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!activity) return res.status(404).json({ error: 'Activity not found' });
    res.json({ message: 'Activity deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete activity' });
  }
}; 