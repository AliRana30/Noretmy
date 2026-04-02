import { useState, useEffect } from "react";

export const useCountdown = (deliveryDate?: string, forceZero: boolean = false) => {
  const calculateTimeLeft = () => {
    if (forceZero || !deliveryDate) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const now = new Date().getTime();
    const deliveryTime = new Date(deliveryDate).getTime();
    if (!Number.isFinite(deliveryTime)) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const difference = deliveryTime - now;

    if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / (1000 * 60)) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer); // Cleanup on unmount
  }, [deliveryDate, forceZero]);

  return timeLeft;
};
