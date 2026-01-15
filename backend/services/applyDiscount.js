const applyDiscountUtil = (jobs) => {
    return jobs.map((job) => {
      const jobObj = typeof job.toObject === 'function' ? job.toObject() : job;
      
      const { discount = 0, pricingPlan } = jobObj;
  
      if (!pricingPlan || discount === 0) {
        return { ...jobObj, pricingPlan };
      }
  
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
  
      return {
        ...jobObj,
        pricingPlan: discountedPricingPlan,
      };
    });
  };
  
module.exports = { applyDiscountUtil };

