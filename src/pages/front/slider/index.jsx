import React, { useEffect, useMemo, useState } from 'react'
import UpcomingEvents from 'components/upcomingEvents'
import Newsletter from 'components/newsletter'
import { DatePicker, Select } from 'antd'
import {
  CalendarOutlined,
  EnvironmentOutlined,
  SearchOutlined,
  ThunderboltFilled,
} from '@ant-design/icons'
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

  const { data: sliders } = generalService.useQueryGetActiveSliders()
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
    <section className="relative overflow-hidden flex items-start md:items-center h-[640px] md:h-auto md:aspect-[16/5]">
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
      <div className="absolute inset-0 bg-black/35 md:hidden" />
      <div className="relative z-10 max-w-[1100px] mx-auto px-6 pt-12 md:py-24 text-center text-white" />
    </section>
  )

  const SearchBar = (
    <div className="max-w-screen-xl mx-auto px-3 md:px-5 -mt-28 md:-mt-10 relative z-20">
      <div className="mobile-home-search bg-white border border-gray-200 rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.18)] p-4 md:p-4 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-3 items-center">
        <Select
          placeholder={t('front.event.selectProvince')}
          allowClear
          showSearch
          size="large"
          className="w-full"
          suffixIcon={<EnvironmentOutlined />}
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
          suffixIcon={<ThunderboltFilled />}
          value={eventType}
          options={eventTypeOption}
          onChange={setEventType}
        />
        <MonthPicker
          key={i18n.language}
          placeholder={t('front.event.selectMonth')}
          size="large"
          style={{ width: '100%' }}
          suffixIcon={<CalendarOutlined />}
          locale={isThai ? thTH : enUS}
          value={selectedMonth}
          onChange={setSelectedMonth}
        />
        <button
          onClick={handleSearch}
          className="md:col-span-1 h-[60px] md:h-10 w-full bg-brand hover:bg-brand-dark text-white font-semibold text-lg md:text-base rounded-xl md:rounded-lg flex items-center justify-center gap-3 md:gap-2 transition-all active:scale-95 shadow-md"
        >
          <SearchOutlined />
          {t('general.search')}
        </button>
      </div>
    </div>
  )

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
