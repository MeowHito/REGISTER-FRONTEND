import React from 'react'
import Slider from '../slider'
import Footer from 'components/footer'

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-40px)] md:min-h-[calc(100vh-65px)] bg-white">
      <Slider />
      <Footer />
    </div>
  )
}