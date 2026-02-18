require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./services/dbService');
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const orderRoutes = require('./routes/orderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const contactRoutes = require('./routes/contactRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const vatRoutes = require('./routes/vatRoutes');
const webhookRoutes = require('./routes/webhooksRoutes')
const withdrawRoutes = require('./routes/withdrawRoutes')
const promotionRoutes = require('./routes/promotionRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const projectRoutes = require('./routes/projectRoutes')
const newsletterRoutes = require('./routes/newsletterRoutes')
const videoRoutes = require('./routes/videoRoutes')
const adminRoutes = require('./routes/adminRoutes');
const faqRoutes = require('./routes/faqRoutes');
const timelineExtensionRoutes = require('./routes/timelineExtensionRoutes');
const badgeRoutes = require('./routes/badgeRoutes');
const chatAttachmentRoutes = require('./routes/chatAttachmentRoutes');
const paymentMilestoneRoutes = require('./routes/paymentMilestoneRoutes');
const emailRoutes = require('./routes/emailRoutes');
const contentRoutes = require('./routes/contentRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');

const { initBadgeCronJobs } = require('./services/badgeCronJobs');
const { initDeadlineCronJobs } = require('./services/orderDeadlineCron');
const { initPromotionExpirationCron } = require('./scripts/expirePromotions');
require('./controllers/vatController'); 

const { uploadFiles, uploadImages } = require('./controllers/uploadController');
const upload = require('./config/multer-cloudinary-storage');
const cookieParser = require('cookie-parser');
const socketHandler = require('./sockets/socketHandler'); // Import socket handler

const app = express();

const allowedOrigins = [
  'http://localhost:8081', 
  'http://localhost:3000',
  'http://localhost:3001',
  'https://www.noretmy.com',
  'https://www.api.noretmy.com',
  'https://admin.noretmy.com',
  'https://noretmy.vercel.app',
  'https://noretmy-admin.vercel.app',
  'https://noretmy-admin-panel.vercel.app',
  'https://noretmy-admin-panel-three.vercel.app'
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('Blocked by CORS:', origin);
      callback(null, false); // Better than throwing an error
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization','x-user-id', 'x-platform'],
  credentials: true,
  optionsSuccessStatus: 204, // Respond with 204 for preflight requests

};

app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

app.use('/api/webhook', webhookRoutes);

app.use('/api/payment', paymentRoutes);

app.use(express.json());
app.use(cookieParser());

connectDB();

app.get('/', (req, res) => { 
  try { 
    res.send('Hello, World!'); 
  } catch (error) { 
    console.error('Error in / route:', error); 
    res.status(500).send('Internal Server Error'); 
  } 
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version
  });
});


app.use('/api', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/vat', vatRoutes);
app.use('/api/withdraw',withdrawRoutes );
app.use('/api/subscription',promotionRoutes)
app.use('/api/notification',notificationRoutes)
app.use("/api/project",projectRoutes)
app.use("/api/newsletter",newsletterRoutes)
app.use('/api/video', videoRoutes)
app.use('/api/admin', adminRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/timeline-extension', timelineExtensionRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/chat-attachments', chatAttachmentRoutes);
app.use('/api/payment-milestones', paymentMilestoneRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/password-reset', passwordResetRoutes);

app.use((err, req, res, next) => {
  const errorStatus = err.status || err.statusCode || 500;
  const errorMessage = err.message || "Something went wrong!";
  
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    ...(err.errors && { errors: err.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['polling', 'websocket'],
  allowUpgrades: true
});

// Handle socket.io errors at the server level
io.engine.on('connection_error', (err) => {
  console.error('Socket.IO connection error:', err.message);
});

socketHandler(io);

app.set('io', io);
global.io = io;
console.log('🔌 Socket.IO initialized and attached to Express app');

const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  initBadgeCronJobs();
  initDeadlineCronJobs();
  initPromotionExpirationCron();
});

// Global error handlers to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
