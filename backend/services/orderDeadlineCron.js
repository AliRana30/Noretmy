const cron = require('node-cron');
const Order = require('../models/Order');
const User = require('../models/User');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const { sendDeadlineWarningEmail } = require('./emailService');
const notificationService = require('./notificationService');

/**
 * Initialize cron jobs for order deadlines
 * Runs every hour to check for expired orders
 */
const initDeadlineCronJobs = () => {
    cron.schedule('0 * * * *', async () => {
        console.log('⏰ Running Order Deadline Check Cron...');
        try {
            const now = new Date();
            
            const expiredOrders = await Order.find({
                status: { $in: ['accepted', 'requirementsSubmitted', 'started', 'halfwayDone', 'requestedRevision'] },
                deliveryDate: { $lt: now },
                autoDeadlineExtended: { $ne: true },
                isCompleted: false
            });

            console.log(`🔍 Found ${expiredOrders.length} expired orders to extend.`);

            for (const order of expiredOrders) {
                try {
                    const oldDeadline = order.deliveryDate;
                    const newDeadline = new Date(oldDeadline);
                    newDeadline.setDate(newDeadline.getDate() + 2);
                    
                    order.deliveryDate = newDeadline;
                    order.autoDeadlineExtended = true;
                    
                    order.timeline.push({
                        event: 'Deadline Auto-Extended',
                        description: `Deadline was automatically extended by 2 days due to expiration.`,
                        timestamp: new Date(),
                        actor: 'system'
                    });

                    await order.save();

                    const seller = await User.findById(order.sellerId);
                    const gig = await Job.findById(order.gigId);

                    if (seller && seller.email) {
                        await sendDeadlineWarningEmail(seller.email, {
                            orderId: order._id,
                            sellerName: seller.fullName || seller.username,
                            gigTitle: gig?.title || 'Gig',
                            newDeadline: newDeadline.toLocaleString()
                        });
                        console.log(`📧 Deadline warning email sent to seller: ${seller.email}`);
                    }

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

const initAdminNotificationCleanupCronJobs = () => {
    cron.schedule('30 2 * * *', async () => {
        console.log('🧹 Running Admin Notification Cleanup Cron...');

        try {
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - 1);

            const adminUsers = await User.find({ role: { $regex: /^admin$/i } }).select('_id').lean();
            const adminIds = adminUsers.map((admin) => String(admin._id));

            const filter = {
                createdAt: { $lt: cutoffDate },
                $or: [{ link: { $regex: /^\/admin/i } }],
            };

            if (adminIds.length > 0) {
                filter.$or.push({ userId: { $in: adminIds } });
            }

            const result = await Notification.deleteMany(filter);

            console.log(
                `🧹 Admin notification cleanup removed ${result.deletedCount || 0} notifications older than ${cutoffDate.toISOString()}`
            );
        } catch (error) {
            console.error('❌ Error in Admin Notification Cleanup Cron:', error);
        }
    });

    console.log('✅ Admin Notification Cleanup Cron Job scheduled (Daily at 2:30 AM)');
};

module.exports = { initDeadlineCronJobs, initAdminNotificationCleanupCronJobs };
