const onlineUsers = new Map(); // userId -> { socketId, lastSeen }

const socketHandler = (io) => {
    io.on('connection', (socket) => {
      console.log('🔌 [Socket] Connected:', socket.id);
      socket.on('userOnline', async (userId) => {
        if (userId) {
          onlineUsers.set(userId, {
            socketId: socket.id,
            lastSeen: new Date()
          });
          socket.userId = userId;

          const userRoom = `user_${userId}`;
          socket.join(userRoom);
          
          try {
            const User = require('../models/User');
            const user = await User.findById(userId).select('role');
            if (user && (user.role === 'admin' || user.role?.toLowerCase() === 'admin')) {
              socket.join('admin_room');
              console.log('👑 [Socket] Admin joined admin_room:', { userId, socketId: socket.id });
            }
          } catch (err) {
            console.error('[Socket] Error checking user role:', err.message);
          }
          
          console.log('🟢 [Socket] userOnline:', { userId, socketId: socket.id, room: userRoom });
          
          io.emit('userStatusChange', {
            userId,
            status: 'online',
            lastSeen: new Date()
          });
          
          }
      });
      
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
  
      socket.on('joinRoom', (conversationId) => {
        socket.join(conversationId);
        socket.to(conversationId).emit('userJoinedRoom', {
          conversationId,
          userId: socket.userId,
          socketId: socket.id
        });
      });
      
      socket.on('leaveRoom', (conversationId) => {
        socket.leave(conversationId);
        });
  
      socket.on('sendMessage', (messageData) => {
        const { conversationId, message, senderId, receiverId } = messageData;
        
        io.to(conversationId).emit('receiveMessage', {
          ...message,
          senderId,
          receiverId,
          conversationId,
          timestamp: new Date()
        });
        
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
      
      socket.on('typing', ({ conversationId, userId, isTyping }) => {
        socket.to(conversationId).emit('userTyping', {
          userId,
          isTyping,
          conversationId
        });
      });
      
      socket.on('messagesRead', ({ conversationId, userId, messageIds }) => {
        socket.to(conversationId).emit('messagesMarkedRead', {
          conversationId,
          userId,
          messageIds,
          readAt: new Date()
        });
      });
  
      socket.on('disconnect', () => {
        const userId = socket.userId;
        
        if (userId && onlineUsers.has(userId)) {
          onlineUsers.delete(userId);
          
          io.emit('userStatusChange', {
            userId,
            status: 'offline',
            lastSeen: new Date()
          });

          console.log('🔴 [Socket] Disconnected:', { userId, socketId: socket.id });
        } else {
          console.log('🔴 [Socket] Disconnected:', { socketId: socket.id });
        }
      });
  
      socket.on('error', (err) => {
        console.error('Socket error:', err);
      });
    });
    
    io.isUserOnline = (userId) => {
      return onlineUsers.has(userId);
    };
    
    io.getUserSocket = (userId) => {
      const user = onlineUsers.get(userId);
      return user ? user.socketId : null;
    };
  };
  
  module.exports = socketHandler;
  