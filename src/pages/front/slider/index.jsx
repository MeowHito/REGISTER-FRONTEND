import React, { useEffect, useMemo, useState } from 'react'
import UpcomingEvents from 'components/upcomingEvents'
import Newsletter from 'components/newsletter'
import { DatePicker, Select, Spin } from 'antd'
import { SearchOutlined, ThunderboltFilled } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import thTH from 'antd/es/date-picker/locale/th_TH'
import enUS from 'antd/es/date-picker/locale/en_US'
import { BANNER } from 'assets'
import generalService from 'services/general.services'
import useCountryStateHook from 'hooks/useCountryStateHook'
import { eventTypeOption } from 'constants/options/eventTypeOption'

const { MonthPicker } = DatePicker

function Slider() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isThai = i18n.language === 'th'

  const { data: sliders, isLoading } = generalService.useQueryGetActiveSliders()
  const { isLoadingProvince, provinceOption } = useCountryStateHook()

  const [provinceId, setProvinceId] = useState(null)
  const [eventType, setEventType] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)
  const [currentSlide, setCurrentSlide] = useState(0)

  const images = useMemo(() => {
    if (sliders && sliders.length > 0) {
      return sliders.map((s) => s.imagePreviewUrl || BANNER)
    }
    return [BANNER]
  }, [sliders])

  useEffect(() => {
    if (images.length <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [images.length])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (provinceId) params.set('province', provinceId)
    if (eventType) params.set('type', eventType)
    if (selectedMonth) params.set('month', dayjs(selectedMonth).format('YYYY-MM'))
    navigate(`/event${params.toString() ? `?${params.toString()}` : ''}`)
  }

  const Hero = (
    <section className="relative overflow-hidden flex items-center aspect-[16/5]">
      {/* Background images */}
      <div className="absolute inset-0">
        {images.map((img, index) => (
          <div
            key={`hero-bg-${index}`}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{ backgroundImage: `url(${img})`, opacity: index === currentSlide ? 1 : 0 }}
          />
        ))}
      </div>
      <div className="relative z-10 max-w-[1100px] mx-auto px-5 py-14 md:py-24 text-center text-white">
        
        
      </div>
    </section>
  )

  const SearchBar = (
    <div className="max-w-screen-xl mx-auto px-4 md:px-5 mt-4 md:-mt-10 relative z-20">
      <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl shadow-xl p-2.5 md:p-4 grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3 items-center">
        <Select
          placeholder={t('front.event.selectProvince')}
          allowClear
          showSearch
          size="large"
          className="w-full"
          value={provinceId}
          options={provinceOption}
          disabled={isLoadingProvince}
          onChange={setProvinceId}
          filterOption={(input, option) => {
            const str = option.filterLabel || (typeof option.label === 'string' ? option.label : '')
            return str.toLowerCase().includes(input.toLowerCase())
          }}
        />
        <Select
          placeholder={t('front.event.selectEventType')}
          allowClear
          size="large"
          className="w-full"
          value={eventType}
          options={eventTypeOption}
          onChange={setEventType}
        />
        <MonthPicker
          key={i18n.language}
          placeholder={t('front.event.selectMonth')}
          size="large"
          style={{ width: '100%' }}
          locale={isThai ? thTH : enUS}
          value={selectedMonth}
          onChange={setSelectedMonth}
        />
        <button
          onClick={handleSearch}
          className="col-span-3 md:col-span-1 h-10 w-full bg-brand hover:bg-brand-dark text-white font-semibold text-sm md:text-base rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
        >
          <SearchOutlined />
          {t('general.search')}
        </button>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center aspect-[16/5] bg-gray-100">
          <Spin size="large" />
        </div>
        <div className="p-0 flex-1">
          <UpcomingEvents />
          <Newsletter />
        </div>
      </>
    )
  }

  return (
    <>
      {Hero}
      {SearchBar}
      <div className="p-0 flex-1">
        <UpcomingEvents />
        <Newsletter />
      </div>
    </>
  )
}

export default Slider
