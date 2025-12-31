const Conversation = require("../models/Conversation");
const User = require("../models/User");
const UserProfile = require("../models/UserProfile");

// const createConverstion = async (req, res,next) => {
//     // Implementation
//     const newConversation= new Conversation({
//       id: req.isSeller ? req.userId + req.body.to : req.body.to+req.userId,
//       sellerId: req.isSeller ? req.userId :req.body.to,
//       buyerId :req.isSeller ? req.body.to :req.userId,
//       readBySeller:req.isSeller,
//       readByBuyer: !req.isSeller,

//     })
//     try { 
//       const savedConversation= await newConversation.save();

//       res.status(201).send(savedConversation);
      
//     } catch (error) {
//       next(error)
//     }
//   };
  
const createConverstion = async (req, res,next) => {

  
  try { 
    const {sellerId, buyerId} = req.body;

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
      // Use findOne() to retrieve a single conversation document
      const conversation = await Conversation.findOne({ id: req.params.id });
  
      // If no conversation is found, return a 204 (No Content) status
      if (!conversation) {
        return res.status(204).send(); // 204 means no content, so no body will be returned
      }

      // Fetch seller data
      const seller = await User.findById(conversation.sellerId);
      const sellerProfile = await UserProfile.findOne({ userId: conversation.sellerId });

      // Fetch buyer data
      const buyer = await User.findById(conversation.buyerId);
      const buyerProfile = await UserProfile.findOne({ userId: conversation.buyerId });

      // Enrich conversation with seller and buyer details
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
  
      // Return the enriched conversation
      res.status(200).json(enrichedConversation);
    } catch (error) {
      next(error);
    }
  };
  
  
  
//   const getConverstions =async  (req, res,next) => {
//     // Implementation
// try {
//   const conversations= await Conversation.find(req.isSeller? {sellerId: req.userId} : {buyerId:req.userId});
//   res.status(200).send(conversations);
// } catch (error) {
//   next(error);
  
// }

//   };

// const getConverstions = async (req, res, next) => {
//   try {
//     const conversations = await Conversation.find(
//       req.isSeller ? { sellerId: req.userId } : { buyerId: req.userId }
//     )
//       .populate({
//         path: 'sellerId', // Populate sellerId
//         select: 'username',
//         populate: {
//           path: 'userProfile', // Populate userProfile (assuming UserProfile is linked to User)
//           select: 'profilePicture', // Only get profilePicture
//         },
//       })
//       .populate({
//         path: 'buyerId', // Populate buyerId
//         select: 'username',
//         populate: {
//           path: 'userProfile', // Populate userProfile for buyer
//           select: 'profilePicture',
//         },
//       });

//     // Send the populated conversations
//     res.status(200).send(conversations);
//   } catch (error) {
//     next(error); // Pass the error to error-handling middleware
//   }
// };

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
    // Fetch conversations where user is either seller OR buyer
    // This ensures users see all their conversations regardless of role
    const conversations = await Conversation.find({
      $or: [
        { sellerId: req.userId },
        { buyerId: req.userId }
      ]
    }).sort({ updatedAt: -1 }); // Sort by most recent first

    // Enrich conversations with data from User and UserProfile
    const enrichedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        // Fetch seller data
        const seller = await User.findById(conversation.sellerId);
        const sellerProfile = await UserProfile.findOne({ userId: conversation.sellerId });

        // Fetch buyer data
        const buyer = await User.findById(conversation.buyerId);
        const buyerProfile = await UserProfile.findOne({ userId: conversation.buyerId });

        // Add seller and buyer details to the conversation
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

    // Send the enriched conversation data in the response
    res.status(200).send(enrichedConversations);
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
};


  
  const updateConverstion = async (req, res,next) => {
    console.log(req.params.id);
    // Implementation
    try {
      const updatedConveration= await Conversation.findOneAndUpdate({id:req.params.id},{
        $set:{
          // readBySeller: true,
          // readByBuyer: true,
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
  