import React, { useEffect, useMemo, useState } from 'react'
import EventResults from 'components/eventResults'
import { AutoComplete, Select } from 'antd'
import {
  EnvironmentOutlined,
  SearchOutlined,
  ThunderboltFilled,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { BANNER } from 'assets'
import generalService from 'services/general.services'
import useCountryStateHook from 'hooks/useCountryStateHook'
import { eventTypeOption } from 'constants/options/eventTypeOption'

function Slider() {
  const { t } = useTranslation()

  const { data: sliders, isLoading: isLoadingSliders, isFetched: slidersFetched } =
    generalService.useQueryGetActiveSliders()
  const { isLoadingProvince, provinceOption } = useCountryStateHook()

  // Filters applied to the inline results grid
  const [provinceId, setProvinceId] = useState(null)
  const [eventType, setEventType] = useState(null)
  const [appliedName, setAppliedName] = useState(null)

  // Event-name autocomplete
  const [nameInput, setNameInput] = useState('')
  const [currentSlide, setCurrentSlide] = useState(0)

  // Fetch a pool of events for name suggestions
  const suggestionPaging = useMemo(() => ({ size: 100, page: 0, search: [] }), [])
  const { data: suggestionData, refetch: refetchSuggestions } =
    generalService.useQueryGetAllEvents({
      paging: suggestionPaging,
      queryKey: ['homeEventSuggestions', suggestionPaging],
    })
  useEffect(() => {
    refetchSuggestions()
  }, [refetchSuggestions])

  const nameOptions = useMemo(() => {
    const list = suggestionData?.content || []
    const seen = new Set()
    const keyword = nameInput.trim().toLowerCase()
    return list
      .map((e) => e.name)
      .filter((name) => {
        if (!name || seen.has(name)) return false
        seen.add(name)
        return !keyword || name.toLowerCase().includes(keyword)
      })
      .slice(0, 8)
      .map((name) => ({ value: name }))
  }, [suggestionData, nameInput])

  // Hero banner images — avoid showing default BANNER until the query settles
  const images = useMemo(() => {
    if (sliders && sliders.length > 0) {
      return sliders.map((s) => s.imagePreviewUrl || BANNER)
    }
    if (slidersFetched) return [BANNER]
    return []
  }, [sliders, slidersFetched])

  useEffect(() => {
    if (images.length <= 1) return
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [images.length])

  const handleSearch = (value) => {
    setAppliedName((value ?? nameInput).trim() || null)
  }

  const showHeroSkeleton = isLoadingSliders && images.length === 0

  const Hero = (
    <section className="relative overflow-hidden flex items-start md:items-center h-[640px] md:h-auto md:aspect-[16/5] bg-gray-100">
      {/* Background images */}
      <div className="absolute inset-0">
        {showHeroSkeleton && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-100 animate-pulse" />
        )}
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
      <div className="mobile-home-search bg-white border border-gray-200 rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.18)] p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <Select
          placeholder={t('front.event.selectProvince')}
          allowClear
          showSearch
          size="large"
          className="w-full md:flex-1"
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
          className="w-full md:flex-1"
          suffixIcon={<ThunderboltFilled />}
          value={eventType}
          options={eventTypeOption}
          onChange={setEventType}
        />
        <AutoComplete
          className="w-full md:flex-[1.4]"
          size="large"
          value={nameInput}
          options={nameOptions}
          placeholder={t('front.home.searchEventName')}
          suffixIcon={<SearchOutlined />}
          onChange={setNameInput}
          onSelect={(value) => { setNameInput(value); handleSearch(value) }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
          allowClear
          onClear={() => { setNameInput(''); setAppliedName(null) }}
        />
        <button
          onClick={() => handleSearch()}
          className="h-[60px] md:h-10 md:w-auto md:shrink-0 w-full bg-brand hover:bg-brand-dark text-white font-semibold text-lg md:text-sm rounded-xl md:rounded-lg flex items-center justify-center gap-2 md:px-6 transition-all active:scale-95 shadow-md"
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
        <EventResults
          provinceId={provinceId}
          eventType={eventType}
          eventName={appliedName}
        />
      </div>
    </>
  )
}

export default Slider
