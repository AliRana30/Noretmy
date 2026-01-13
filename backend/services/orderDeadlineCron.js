const cron = require('node-cron');
const Order = require('../models/Order');
const User = require('../models/User');
const Job = require('../models/Job');
const { sendDeadlineWarningEmail } = require('./emailService');
const notificationService = require('./notificationService');

/**
 * Initialize cron jobs for order deadlines
 * Runs every hour to check for expired orders
 */
const initDeadlineCronJobs = () => {
    // Run every hour
    cron.schedule('0 * * * *', async () => {
        console.log('⏰ Running Order Deadline Check Cron...');
        try {
            const now = new Date();
            
            // Find active orders that have passed their delivery date and haven't been auto-extended yet
            const expiredOrders = await Order.find({
                status: { $in: ['accepted', 'requirementsSubmitted', 'started', 'halfwayDone', 'requestedRevision'] },
                deliveryDate: { $lt: now },
                autoDeadlineExtended: { $ne: true },
                isCompleted: false
            });

            console.log(`🔍 Found ${expiredOrders.length} expired orders to extend.`);

            for (const order of expiredOrders) {
                try {
                    // 1. Extend deadline by 2 days
                    const oldDeadline = order.deliveryDate;
                    const newDeadline = new Date(oldDeadline);
                    newDeadline.setDate(newDeadline.getDate() + 2);
                    
                    order.deliveryDate = newDeadline;
                    order.autoDeadlineExtended = true;
                    
                    // Add timeline event
                    order.timeline.push({
                        event: 'Deadline Auto-Extended',
                        description: `Deadline was automatically extended by 2 days due to expiration.`,
                        timestamp: new Date(),
                        actor: 'system'
                    });

                    await order.save();

                    // 2. Fetch seller and gig info for email
                    const seller = await User.findById(order.sellerId);
                    const gig = await Job.findById(order.gigId);

                    if (seller && seller.email) {
                        // 3. Send warning email to freelancer
                        await sendDeadlineWarningEmail(seller.email, {
                            orderId: order._id,
                            sellerName: seller.fullName || seller.username,
                            gigTitle: gig?.title || 'Gig',
                            newDeadline: newDeadline.toLocaleString()
                        });
                        console.log(`📧 Deadline warning email sent to seller: ${seller.email}`);
                    }

                    // 4. Create internal notification for seller
                    await notificationService.createNotification({
                        userId: order.sellerId,
                        title: '⚠️ Order Deadline Expired',
                        message: `The deadline for "${gig?.title || 'Order'}" has expired. It has been automatically extended by 2 days.`,
                        type: 'warning',
                        link: `/orders/${order._id}`
                    });

                } catch (orderErr) {
                    console.error(`❌ Error processing extension for order ${order._id}:`, orderErr.message);
                }
            }
        } catch (error) {
            console.error('❌ Error in Order Deadline Cron:', error);
        }
    });

    console.log('✅ Order Deadline Cron Job scheduled (Every hour)');
};

module.exports = { initDeadlineCronJobs };
