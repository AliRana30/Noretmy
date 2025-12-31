import React from 'react';

interface NavbuttonProps {
  title: string;
  href: string;
}
const Navbutton = (props: NavbuttonProps) => {
  return (
    <>
      <a
        href={props.href}
        className="items-center text-dark-secondary px-5 py-4 gap-[10px] text-p1 hover:text-orange-primary"
      >
        {props.title}
      </a>
    </>
  );
};

export default Navbutton;
