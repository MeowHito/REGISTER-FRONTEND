import React from "react";
import Slider from "react-slick";

const CustomNextArrow = (props) => (
  <button className="border-0" onClick={props.onClick}>
    <i className="icon-right fas fa-angle-right slick-arrow"></i>
  </button>
);

const CustomPrevArrow = (props) => (
  <button className="border-0" onClick={props.onClick}>
    <i className="icon-left fas fa-angle-left slick-arrow"></i>
  </button>
);

export default function Slick({ className = "", config, children }) {
  return (
    <Slider
      className={className}
      {...config}
      nextArrow={<CustomNextArrow />}
      prevArrow={<CustomPrevArrow />}
    >
      {children}
    </Slider>
  );
}
