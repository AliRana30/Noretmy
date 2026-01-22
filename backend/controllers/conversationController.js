const Conversation = require("../models/Conversation");
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");



      
  
const createConverstion = async (req, res,next) => {

  try { 
    const {sellerId, buyerId} = req.body;

    // Check if conversation already exists between these users
    const existingConversation = await Conversation.findOne({
      $or: [
        { sellerId, buyerId },
        { sellerId: buyerId, buyerId: sellerId }
      ]
    });

    // If conversation exists, return it instead of creating new one
    if (existingConversation) {
      return res.status(200).json({ conversationId: existingConversation.id });
    }

  const newConversation= new Conversation({
    id: sellerId + buyerId,
    sellerId,
    buyerId,
    readBySeller:req.isSeller,
    readByBuyer: !req.isSeller,

  })

    const savedConversation= await newConversation.save();

    res.status(201).send({conversationId : savedConversation.id});
    
  } catch (error) {
    next(error)
  }
};

  const getConverstion = async (req, res, next) => {
    try {
      const conversation = await Conversation.findOne({ id: req.params.id });
  
      if (!conversation) {
        return res.status(204).send(); // 204 means no content, so no body will be returned
      }

      const seller = await User.findById(conversation.sellerId);
      const sellerProfile = await UserProfile.findOne({ userId: conversation.sellerId });

      const buyer = await User.findById(conversation.buyerId);
      const buyerProfile = await UserProfile.findOne({ userId: conversation.buyerId });

      const enrichedConversation = {
        ...conversation.toObject(),
        seller: {
          _id: seller?._id || null,
          username: seller?.username || null,
          profilePicture: sellerProfile?.profilePicture || null,
        },
        buyer: {
          _id: buyer?._id || null,
          username: buyer?.username || null,
          profilePicture: buyerProfile?.profilePicture || null,
        },
      };
  
      res.status(200).json(enrichedConversation);
    } catch (error) {
      next(error);
    }
  };

  




const getConversationBySellerandBuyerIds = async (req,res)=>{
const { sellerId, buyerId } = req.params;

  try {
    const conversation = await Conversation.findOne({ sellerId, buyerId });

    if (conversation) {
      return res.status(200).json({ conversationId: conversation.id });
    } else {
      return res.status(204).send(); // No content, means no conversation exists
    }
  } catch (error) {
    console.error("Error fetching conversation:", error);
    res.status(500).json({ message: "Internal server error" });
  }

}

const getConverstions = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      $or: [
        { sellerId: req.userId },
        { buyerId: req.userId }
      ]
    }).sort({ updatedAt: -1 }); // Sort by most recent first

    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const seller = await User.findById(conversation.sellerId);
        const sellerProfile = await UserProfile.findOne({ userId: conversation.sellerId });

        const buyer = await User.findById(conversation.buyerId);
        const buyerProfile = await UserProfile.findOne({ userId: conversation.buyerId });

        return {
          ...conversation.toObject(), // Include all original conversation fields
          seller: {
            _id: seller?._id || null,
            username: seller?.username || null,
            profilePicture: sellerProfile?.profilePicture || null,
          },
          buyer: {
            _id: buyer?._id || null,
            username: buyer?.username || null,
            profilePicture: buyerProfile?.profilePicture || null,
          },
        };
      })
    );

    res.status(200).send(enrichedConversations);
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
};

  const updateConverstion = async (req, res,next) => {
    try {
      const updatedConveration= await Conversation.findOneAndUpdate({id:req.params.id},{
        $set:{
          ...(req.isSeller? {readBySeller:true} :{readByBuyer:true})
        },
      },
      { new:true}
    );

    res.status(200).send(updatedConveration);

    } catch (error) {
      
    }
  };
  
  module.exports = {
    createConverstion,
    getConverstion,
    getConverstions,
    updateConverstion,
    getConversationBySellerandBuyerIds
  };
  