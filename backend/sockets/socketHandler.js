// Store online users with their socket IDs
const onlineUsers = new Map(); // userId -> { socketId, lastSeen }

const socketHandler = (io) => {
    io.on('connection', (socket) => {
      console.log('A user connected:', socket.id);
      
      // Handle user going online
      socket.on('userOnline', (userId) => {
        if (userId) {
          onlineUsers.set(userId, {
            socketId: socket.id,
            lastSeen: new Date()
          });
          socket.userId = userId;
          
          // Broadcast user's online status to all connected clients
          io.emit('userStatusChange', {
            userId,
            status: 'online',
            lastSeen: new Date()
          });
          
          console.log(`User ${userId} is now online. Total online: ${onlineUsers.size}`);
        }
      });
      
      // Handle getting online users
      socket.on('getOnlineUsers', (userIds) => {
        const statuses = {};
        userIds.forEach(userId => {
          const user = onlineUsers.get(userId);
          statuses[userId] = {
            isOnline: !!user,
            lastSeen: user?.lastSeen || null
          };
        });
        socket.emit('onlineUsersStatus', statuses);
      });
  
      // Handle user joining a room (conversation)
      socket.on('joinRoom', (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.userId || 'unknown'} joined room: ${conversationId}`);
        
        // Notify others in the room that someone joined
        socket.to(conversationId).emit('userJoinedRoom', {
          conversationId,
          userId: socket.userId,
          socketId: socket.id
        });
      });
      
      // Handle leaving a room
      socket.on('leaveRoom', (conversationId) => {
        socket.leave(conversationId);
        console.log(`User ${socket.userId || 'unknown'} left room: ${conversationId}`);
      });
  
      // Handle sending a message
      socket.on('sendMessage', (messageData) => {
        const { conversationId, message, senderId, receiverId } = messageData;
        
        // Emit the message to everyone in the room including sender
        io.to(conversationId).emit('receiveMessage', {
          ...message,
          senderId,
          receiverId,
          conversationId,
          timestamp: new Date()
        });
        
        console.log(`Message sent to room ${conversationId} from ${senderId}:`, message.text?.substring(0, 50));
        
        // If receiver is online but not in room, send notification
        const receiver = onlineUsers.get(receiverId);
        if (receiver && receiver.socketId) {
          io.to(receiver.socketId).emit('newMessageNotification', {
            conversationId,
            senderId,
            message: {
              text: message.text?.substring(0, 100),
              timestamp: new Date()
            }
          });
        }
      });
      
      // Handle typing indicator
      socket.on('typing', ({ conversationId, userId, isTyping }) => {
        socket.to(conversationId).emit('userTyping', {
          userId,
          isTyping,
          conversationId
        });
      });
      
      // Handle message read status
      socket.on('messagesRead', ({ conversationId, userId, messageIds }) => {
        socket.to(conversationId).emit('messagesMarkedRead', {
          conversationId,
          userId,
          messageIds,
          readAt: new Date()
        });
      });
  
      // Handle user disconnection
      socket.on('disconnect', () => {
        const userId = socket.userId;
        
        if (userId && onlineUsers.has(userId)) {
          onlineUsers.delete(userId);
          
          // Broadcast user's offline status
          io.emit('userStatusChange', {
            userId,
            status: 'offline',
            lastSeen: new Date()
          });
          
          console.log(`User ${userId} disconnected. Total online: ${onlineUsers.size}`);
        } else {
          console.log('Unknown user disconnected:', socket.id);
        }
      });
  
      // Handle errors
      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });
    });
    
    // Helper function to check if user is online
    io.isUserOnline = (userId) => {
      return onlineUsers.has(userId);
    };
    
    // Helper function to get user's socket
    io.getUserSocket = (userId) => {
      const user = onlineUsers.get(userId);
      return user ? user.socketId : null;
    };
  };
  
  module.exports = socketHandler;
  