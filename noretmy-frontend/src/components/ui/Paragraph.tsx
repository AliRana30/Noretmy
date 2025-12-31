import React from 'react';

interface ParagraphProps {
  color: string;
  title: string;
}
const Paragraph = (props: ParagraphProps) => {
  return (
    <>
      <p className={`text-hh4 font-normal text-${props.color}`}>
        {props.title}
      </p>
    </>
  );
};

export default Paragraph;
