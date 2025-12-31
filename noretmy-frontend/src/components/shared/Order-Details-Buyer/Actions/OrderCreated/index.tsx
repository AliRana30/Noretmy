"use client" 
 
import { useCountdown } from '@/util/time';
import React, { useState } from 'react'; 
import { FaCalendarAlt, FaClock, FaUser, FaDollarSign } from 'react-icons/fa'; 
 
const OrderDetails = ({orderDate,deliveryDate,sellerName,price}) => { 
 
  const timeLeft = useCountdown(deliveryDate);
  
  console.log(timeLeft) 
 
  const formattedDeliveryDate = new Date(deliveryDate).toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric", 
  }); 
 
 
  const formattedOrderDate = new Date(orderDate).toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "long", 
    day: "numeric", 
  }); 
 
  return ( 
    <div className="p-6 rounded-lg"> 
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
        <div className="flex items-center"> 
          <FaCalendarAlt className="w-5 h-5 text-gray-500 mr-3" /> 
          <div> 
            <p className="text-sm text-gray-500">Order Date</p> 
            <p className="text-gray-800">{formattedOrderDate}</p> 
          </div> 
        </div> 
 
        <div className="flex items-center"> 
          <FaClock className="w-5 h-5 text-gray-500 mr-3" /> 
          <div> 
            <p className="text-sm text-gray-500">Expected Delivery</p>
            <div className="flex space-x-2 mt-2"> 
              {[
                { unit: 'Days', value: timeLeft.days }, 
                { unit: 'Hours', value: timeLeft.hours }, 
                { unit: 'Minutes', value: timeLeft.minutes }, 
                { unit: 'Seconds', value: timeLeft.seconds }
              ].map(({ unit, value }) => (
                <div 
                  key={unit} 
                  className="bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center w-16 h-16 shadow-sm"
                >
                  <span className="text-2xl font-bold text-gray-800">{value}</span>
                  <span className="text-xs text-gray-500 uppercase">{unit}</span>
                </div>
              ))}
            </div>
          </div> 
        </div> 
 
        <div className="flex items-center"> 
          <FaUser className="w-5 h-5 text-gray-500 mr-3" /> 
          <div> 
            <p className="text-sm text-gray-500">Seller</p> 
            <p className="text-gray-800">{sellerName}</p> 
          </div> 
        </div> 
 
        <div className="flex items-center"> 
          <FaDollarSign className="w-5 h-5 text-gray-500 mr-3" /> 
          <div> 
            <p className="text-sm text-gray-500">Price</p> 
            <p className="text-gray-800">${price?.toFixed(2)}</p> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
}; 
 
export default OrderDetails;