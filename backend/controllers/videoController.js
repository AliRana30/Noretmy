const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const Order = require('../models/Order');

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

exports.getAgoraToken = async (req, res) => {
  const { orderId } = req.body;
  const {userId} = req; // assuming your verifyToken middleware sets req.user

  if (!orderId) return res.status(400).json({ message: 'Order ID is required' });

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  // Only allow if user is buyer or seller and order is active
  const isParticipant = [order.buyerId, order.sellerId].includes(userId);
  const isActive = true; // You can add your own logic for active status

  if (!isParticipant || !isActive) {
    return res.status(403).json({ message: 'Not allowed to join video call for this order' });
  }

  // Defensive check for env variables
  if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    return res.status(500).json({ message: 'Agora App ID or Certificate is not set in environment variables.' });
  }

  const channelName = orderId;
  const uid = userId; // or any unique identifier for the user
  const role = RtcRole.PUBLISHER;
  const expireTime = 3600; // 1 hour (in seconds)
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTs = currentTimestamp + expireTime;

  // Ensure the privilegeExpireTs is always in the future
  if (privilegeExpireTs <= currentTimestamp) {
    return res.status(500).json({ message: 'Token expiration calculation error. Please try again.' });
  }

  // Always generate a new token for each request
  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID, AGORA_APP_CERTIFICATE, channelName, uid, role, privilegeExpireTs
  );

  res.json({
    appId: AGORA_APP_ID,
    token,
    channelName,
    uid,
    expireAt: privilegeExpireTs
  });
}; 