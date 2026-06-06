import logo from 'assets/images/logo.svg';
import React from "react";
import { useSelector } from 'react-redux';

export default function Preloader() {
  const { isLoading } = useSelector(state => state.context)
  return (
    <div className={`bg-overlay w-screen h-screen fixed flex justify-center items-center ${!isLoading ? "hidden" : ""}`}>
      <img
        src={logo}
        alt="Loading"
        className={`absolute animate-spin-slow`}
      />
    </div>
  );
}
