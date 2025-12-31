import React from 'react';

const MediaProduction = () => {
  return (
    <>
      <svg
        width="61"
        height="60"
        viewBox="0 0 61 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter="url(#filter0_d_474_1045)">
          <rect x="4.5" y="4" width="52" height="52" rx="12" fill="white" />
          <rect
            x="5"
            y="4.5"
            width="51"
            height="51"
            rx="11.5"
            stroke="#EBEBEB"
          />
          <g clip-path="url(#clip0_474_1045)">
            <g clip-path="url(#clip1_474_1045)">
              <path
                d="M30.5 22C22.5 22 21.5 23 21.5 30C21.5 37 22.5 38 30.5 38C38.5 38 39.5 37 39.5 30C39.5 23 38.5 22 30.5 22ZM33.5 30.2L28.7 33C28.6 33.1 28.4 33 28.4 32.8V27.2C28.4 27 28.5 26.9 28.7 27L33.5 29.8C33.7 29.9 33.7 30.1 33.5 30.2Z"
                stroke="#7F7F7F"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>
        </g>
        <defs>
          <filter
            id="filter0_d_474_1045"
            x="0.5"
            y="0"
            width="60"
            height="60"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology
              radius="4"
              operator="dilate"
              in="SourceAlpha"
              result="effect1_dropShadow_474_1045"
            />
            <feOffset />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.976471 0 0 0 0 0.976471 0 0 0 0 0.976471 0 0 0 1 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_474_1045"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect1_dropShadow_474_1045"
              result="shape"
            />
          </filter>
          <clipPath id="clip0_474_1045">
            <rect
              width="24"
              height="24"
              fill="white"
              transform="translate(18.5 18)"
            />
          </clipPath>
          <clipPath id="clip1_474_1045">
            <rect
              width="24"
              height="24"
              fill="white"
              transform="translate(18.5 18)"
            />
          </clipPath>
        </defs>
      </svg>
    </>
  );
};

export default MediaProduction;
