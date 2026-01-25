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
          
          // Broadcast to all clients that this user is online
          io.emit('userStatusChange', {
            userId,
            status: 'online',
            lastSeen: new Date()
          });
          
          // Also emit specific events for compatibility
          io.emit('userOnline', userId);
          
          }
      });
      
      socket.on('getOnlineUsers', (userIds) => {
        try {
          const statuses = {};
          if (Array.isArray(userIds)) {
            userIds.forEach(userId => {
              const user = onlineUsers.get(userId);
              statuses[userId] = {
                isOnline: !!user,
                lastSeen: user?.lastSeen || null
              };
            });
          } else {
            console.warn('[Socket] getOnlineUsers called with invalid data:', typeof userIds);
          }
          socket.emit('onlineUsersStatus', statuses);
        } catch (err) {
          console.error('[Socket] Error in getOnlineUsers:', err.message);
          socket.emit('onlineUsersStatus', {});
        }
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
        try {
          if (!messageData || !messageData.conversationId) {
            console.warn('[Socket] sendMessage called with invalid data');
            return;
          }
          
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
        } catch (err) {
          console.error('[Socket] Error in sendMessage:', err.message);
        }
      });
      
      socket.on('typing', ({ conversationId, userId, isTyping }) => {
        try {
          if (!conversationId || !userId) {
            console.warn('[Socket] typing event called with invalid data');
            return;
          }
          
          // Emit to all users in the conversation room
          socket.to(conversationId).emit('userTyping', {
            userId,
            isTyping,
            conversationId
          });
          
          console.log(`[Socket] User ${userId} ${isTyping ? 'started' : 'stopped'} typing in ${conversationId}`);
        } catch (err) {
          console.error('[Socket] Error in typing event:', err.message);
        }
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
          
          // Broadcast to all clients that this user is offline
          io.emit('userStatusChange', {
            userId,
            status: 'offline',
            lastSeen: new Date()
          });
          
          // Also emit specific events for compatibility
          io.emit('userOffline', userId);

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
  