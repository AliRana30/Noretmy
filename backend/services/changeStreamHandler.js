const { EventEmitter } = require('events');
const eventEmitter = new EventEmitter();
const mongoose = require('mongoose'); // Import mongoose

async function startChangeStream() {
  try {
    const db = mongoose.connection; // Get the Mongoose connection
    const messageCollection = db.collection('messages');

    const changeStream = messageCollection.watch();

    changeStream.on('change', (change) => {
      if (change.operationType === 'insert') {
        const message = change.fullDocument;
        eventEmitter.emit('message', message);
      }
    });
  } catch (error) {
    console.error('Error setting up change stream:', error);
  }
}

startChangeStream();

module.exports = eventEmitter;
