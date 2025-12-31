import React from 'react';

interface NextarrowProps {
  className?: string;
}

const Nextarrow: React.FC<NextarrowProps> = ({ className }) => {
  return (
    <svg
      width="25"
      height="24"
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className} // Apply the className prop
    >
      <path
        d="M10.1364 17.8181L15.9545 11.9999L10.1364 6.18176"
        stroke="#B8B8B8"
        strokeWidth="1.45455"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Nextarrow;
