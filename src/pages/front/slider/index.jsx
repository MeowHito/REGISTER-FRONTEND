import React, { useEffect, useState } from 'react'
import Event from '../event';
import { Carousel, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { BANNER } from 'assets';
import generalService from 'services/general.services';

function Slider() {
  const { i18n } = useTranslation();
  const { data: sliders, isLoading } = generalService.useQueryGetActiveSliders();
  const [slides, setSlides] = useState([]);

  const fallbackSlides = [
    {
      id: 'fallback-1',
      extendsClass: "text-center",
      image: BANNER
    }
  ];

  useEffect(() => {
    const loadSlides = async () => {
      if (sliders && sliders.length > 0) {
        const loadedSlides =  sliders.map(slider => ({
              id: slider.id,
              extendsClass: slider.alignment || "text-center",
              image: slider.imagePreviewUrl || BANNER,
              descriptionTh: slider.descriptionTh,
              descriptionEn: slider.descriptionEn,
            }));

        setSlides(loadedSlides);
      } else {
        setSlides(fallbackSlides);
      }
    };

    loadSlides();
  }, [sliders]);

  const [, setCurrentSlide] = useState(0);
  useEffect(() => {
    if (slides.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center aspect-[16/5] bg-gray-100">
          <Spin size="large" />
        </div>
        <div className="p-0 flex-1">
          <Event layout="LayoutContent" />
        </div>
      </>
    );
  }

  return (
    <>
      <div
        id="hero-slider"
        className="carousel slide hero-content"
        data-bs-ride="carousel"
      >
        <Carousel autoplay autoplaySpeed={5000}>
          {slides.map((slide, index) => (
            <div key={`carousel-card-${slide.id || index}`}>
              <div
                className={`section-before aspect-[16/5] flex !items-center bg-cover bg-center w-screen md:max-w-[1200px]`}
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                <div className={`container relative z-10 md:max-w-screen-lg  ${slide.extendsClass}`}>
                  <div className="hero-text">
                    {(i18n.language === 'th' ? slide.descriptionTh : slide.descriptionEn) && (
                      <p
                        data-animation="animated fadeInDown"
                        className="text-xs md:text-2xl bg-white/10 backdrop-blur-md text-white rounded-2xl p-2 md:p-4 shadow-xl ring-1 ring-white/10 max-w-3xl mx-auto"
                      >
                        {i18n.language === 'th' ? slide.descriptionTh : slide.descriptionEn}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>
      <div className="p-0 flex-1">
        <Event layout="LayoutContent" />
      </div>
    </>
  )
}

export default Slider
