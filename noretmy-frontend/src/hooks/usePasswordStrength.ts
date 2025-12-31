import { useState, useEffect } from 'react';

export const usePasswordStrength = (password: string) => {
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    const calculateStrength = (pwd: string) => {
      let score = 0;

      // Length check
      if (pwd.length >= 8) score++;
      if (pwd.length >= 12) score++;

      // Character variety checks
      if (/[A-Z]/.test(pwd)) score++;
      if (/[a-z]/.test(pwd)) score++;
      if (/[0-9]/.test(pwd)) score++;
      if (/[^A-Za-z0-9]/.test(pwd)) score++;

      // Normalize score to 0-4 range
      return Math.min(4, Math.floor(score / 1.5));
    };

    setStrength(calculateStrength(password));
  }, [password]);

  return strength;
}; 