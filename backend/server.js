require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Server entry point - Restart trigger
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

// Cron jobs
const { initBadgeCronJobs } = require('./services/badgeCronJobs');
const { initPromotionExpirationCron } = require('./scripts/expirePromotions');

require('./controllers/vatController'); 

const { uploadFiles, uploadImages } = require('./controllers/uploadController');
const upload = require('./config/multer-cloudinary-storage');
const cookieParser = require('cookie-parser');
const socketHandler = require('./sockets/socketHandler'); // Import socket handler

const app = express();

const allowedOrigins = [
  'http://localhost:8081', 
  'https://noretmy-frontend.vercel.app',
  'https://www.noretmy.com',
  'https://www.api.noretmy.com',
  'https://noretmy.vercel.app',
  'https://noretmy-admin.vercel.app',
  'https://noretmy-admin-panel.vercel.app',
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
  allowedHeaders: ['Content-Type', 'Authorization','x-user-id'],
  credentials: true,
  optionsSuccessStatus: 204, // Respond with 204 for preflight requests

};

// Apply CORS middleware
app.use(cors(corsOptions));

// app.use(cors());

// // Handle preflight requests (important!)
// app.options('*', (req, res) => {
//   res.header('Access-Control-Allow-Origin', req.headers.origin);
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.header('Access-Control-Allow-Credentials', 'true');
//   res.sendStatus(204);
// });

// // Ensure CORS headers are set in every response
// app.use((req, res, next) => {
//   const allowedOrigin = allowedOrigins.includes(req.headers.origin) ? req.headers.origin : allowedOrigins[0];
//   res.header('Access-Control-Allow-Origin', allowedOrigin);
//   res.header('Access-Control-Allow-Credentials', 'true');
//   res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   next();
// });
// u

app.use('/api/webhook', webhookRoutes);

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

// Public health check endpoint
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

// Session middleware (if you need session-based authentication)
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
//   })
// );

// Route handlers
app.use('/api', uploadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/job', jobRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payment', paymentRoutes);
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

// Error handling middleware
app.use((err, req, res, next) => {
  const errorStatus = err.status || err.statusCode || 500;
  const errorMessage = err.message || "Something went wrong!";
  
  // Structured JSON error response
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    ...(err.errors && { errors: err.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Create HTTP server and integrate with Socket.io
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  }
});

// Initialize socket handler with the io instance
socketHandler(io);

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, '0.0.0.0', () => {
  // Initialize cron jobs
  initBadgeCronJobs();
  initPromotionExpirationCron();
});
