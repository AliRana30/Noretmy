const applyDiscountUtil = (jobs) => {
    return jobs.map((job) => {
      // Convert to plain object if it's a Mongoose model, otherwise use as-is
      const jobObj = typeof job.toObject === 'function' ? job.toObject() : job;
      
      // Destructure necessary fields from the job
      const { discount = 0, pricingPlan } = jobObj;
  
      // If no pricing plan or discount is 0, return the job unchanged
      if (!pricingPlan || discount === 0) {
        return { ...jobObj, pricingPlan };
      }
  
      // Calculate discounted pricing for each plan
      const discountedPricingPlan = Object.fromEntries(
        Object.entries(pricingPlan).map(([planKey, planValue]) => {
          if (planValue?.price) {
            const discountedPrice = planValue.price - (planValue.price * discount) / 100;
            return [
              planKey,
              {
                ...planValue,
                discountedPrice: parseFloat(discountedPrice.toFixed(2)), // Add `discountedPrice`
              },
            ];
          }
          return [planKey, planValue]; // Return unchanged if no price
        })
      );
  
      // Return the job with updated pricing
      return {
        ...jobObj,
        pricingPlan: discountedPricingPlan,
      };
    });
  };
  
module.exports = { applyDiscountUtil };
  

