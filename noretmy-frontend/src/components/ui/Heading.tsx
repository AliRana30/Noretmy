import React from 'react';

interface HeadingProps {
  color: string;
  title: string;
}
const Heading = (props: HeadingProps) => {
  return (
    <div>
      <p className={`text-Heading text-${props.color} font-bold`}>
        {props.title}
      </p>
    </div>
  );
};

export default Heading;
