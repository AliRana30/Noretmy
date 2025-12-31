const Job = require("../models/Job");
const Order = require("../models/Order");
const Review = require("../models/Review");
const badgeService = require("../services/badgeService");

const createReview = async (req, res, next) => {
    try {
        
      if (req.isSeller) return res.status(403).send("Sellers are not allowed to create reviews!");
  
      const { userId } = req;
      const { orderId, desc, star } = req.body;
  
      if (!userId) return res.status(400).send("User ID is required!");
  
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).send("Order not found!");
  
      if (order.buyerId.toString() !== userId) {
        return res.status(403).json({ error: "You are not authorized to review this order!" });
      }
  
      const existingReview = await Review.findOne({ orderId });
      if (existingReview) {
        return res.status(403).send("You have already created a review for this gig!");
      }
  
      if (!order.gigId) {
        return res.status(400).send("Gig ID is missing from the order!");
      }
  
      const newReview = new Review({
        userId,
        orderId,
        gigId: order.gigId,
        sellerId: order.sellerId, // Add sellerId for easier querying
        desc,
        star,
      });
  
      order.status = "completed";
      const statusUpdate = {
        status: "completed",
        changedAt: new Date(),
      };
      order.statusHistory.push(statusUpdate);
      order.orderCompletionDate = new Date();
      await order.save();
  
      const savedReview = await newReview.save();
  
      const updatedJob = await Job.findByIdAndUpdate(order.gigId, {
        $inc: { totalStars: star, starNumber: 1 },
      });
  
      if (!updatedJob) {
        return res.status(404).send("Gig not found for updating stars!");
      }
  
      // Update seller badge metrics
      try {
        await badgeService.updateSellerMetricsOnOrderComplete(order.sellerId, order);
        await badgeService.updateSellerRating(order.sellerId);
      } catch (badgeError) {
        console.error("Error updating seller badge:", badgeError);
        // Don't fail the review creation if badge update fails
      }
  
      res.status(201).send("Review created successfully!");
    } catch (error) {
      console.error("Error creating review:", error.message);
      next(error);
    }
  };
  
  

 const getReviews=async(req,res,next)=>{
    try {
        
        const reviews= await Review.find({gigId : req.params.id});
        res.status(200).send(reviews);
    } catch (error) {
        next(error);
    }



}

 const deleteReview=async(req,res,next)=>{
    try {
        
        
    } catch (error) {
        next(error);
    }
}

module.exports={ createReview,deleteReview,getReviews}