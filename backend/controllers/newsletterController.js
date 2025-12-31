const Subscriber = require('../models/Newsletter');
const { sendNewsletterWelcomeEmail } = require('../services/emailService');

const subscribe = async (req, res) => {

  const {userId} = req;

  const { email } = req.body;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    // Prevent duplicate subscriptions
    const existing = await Subscriber.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already subscribed' });

    const newSubscriber = new Subscriber({ email,userId });
    await newSubscriber.save();

    await sendNewsletterWelcomeEmail(email);
    res.status(201).json({ message: 'Subscribed successfully!' });
  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const subscribeOrUpdate = async (req, res) => {
  try {
    const {
      email,
      frequency = 1,
      topics = [],
      receiveSpecialOffers = true,
    } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existing = await Subscriber.findOne({ email });

    if (!existing) {
      return res.status(404).json({ message: 'Subscriber not found' });
    }

    // Update fields
    existing.email = email
    existing.frequency = frequency;
    existing.topics = topics;
    existing.receiveSpecialOffers = receiveSpecialOffers;

    await existing.save();

    return res.status(200).json({ message: 'Preferences updated successfully', subscriber: existing });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



  const getPreferencesByUserId = async (req, res) => {
  try {
    const { userId } = req;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const subscriber = await Subscriber.findOne({ userId });

    if (!subscriber) {
      return res.status(404).json({ message: 'Preferences not found for this user' });
    }

    res.status(200).json( subscriber );
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = {
    subscribe , subscribeOrUpdate ,getPreferencesByUserId
};