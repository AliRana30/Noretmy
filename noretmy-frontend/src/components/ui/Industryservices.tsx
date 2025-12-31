import React from 'react';

interface ServicesProps {
  image: string;
  title: string;
  description: string;
}

const Industryservices = (props: ServicesProps) => {
  return (
    <div
      className="relative bg-cover bg-center lg:h-[460px] h-[250px] w-full rounded-2xl overflow-hidden shadow-industry"
      style={{ backgroundImage: `url(${props.image})` }}
    >
      <div className="absolute inset-0 bg-industry"></div>{' '}
      <div className="absolute bottom-0 left-0 text-white text-start p-5">
        <h3 className="text-hh6 font-bold">{props.title}</h3>
        <p className="text-hh4 mt-2 xl:mr-20 lg:mr-10">{props.description}</p>
      </div>
    </div>
  );
};

export default Industryservices;
