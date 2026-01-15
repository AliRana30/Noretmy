const jwt = require('jsonwebtoken');
const Contact = require('../models/Contact'); // Adjust the path to your Contact model
const User = require('../models/User');
const { sendUserNotificationEmail } = require('../services/emailService');

const submitContactForm = async (req, res) => {
    try {
        const { email,subject, message } = req.body;
        const {userId} = req;

        if (!email || !message || !subject) {
            return res.status(400).json({ error: 'Email and message are required.' });
        }

        const newContact = new Contact({
            userId,
            email,
            subject,
            message
        });

        await newContact.save();

        return res.status(201).json({ message: 'Contact form submitted successfully.' });
    } catch (error) {
        console.error('Error submitting contact form:', error);
        return res.status(500).send({ error: 'An error occurred while submitting the contact form.' });
    }
};

const getAllMessages = async (req, res) => {
    try {
        
      const data=  await Contact.find();

        return res.status(201).send(data);
    } catch (error) {
        console.error('Error submitting contact form:', error);
        return res.status(500).send({ error: 'An error occurred while submitting the contact form.' });
    }
};

const replyMessage = async (req, res) => {
    try {
      const { messageId,email ,message} = req.body;

      const response= await Contact.findByIdAndUpdate({_id:messageId},{
        $set:{isReplied:true}
      })
    
      if(!response) return res.status(400).send("Could not reply!");
      await sendUserNotificationEmail(email, 'emailReply',message);
  
      res.status(200).json({ message: "User has been replied" });
    } catch (error) {
      res.status(500).json({ message: "Server errorda", error });
    }
  };

module.exports={getAllMessages,submitContactForm,replyMessage}