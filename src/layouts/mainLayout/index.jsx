import { Layout, Spin } from 'antd'
import { Content } from 'antd/es/layout/layout'
import Header from 'components/header'
import AnnouncementBanner from 'components/announcementBanner'
import React from 'react'
import { useSelector } from 'react-redux'
import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  const loading = useSelector((state) => state.loading.loading);
  return (
    <>
      {loading &&
        <div className="flex justify-center items-center h-screen w-screen bg-black opacity-50 absolute z-50">
          <Spin className="center" />
        </div>
      }
      <Layout className='min-h-screen md:max-w-[1200px] mx-auto'>
        <Header />
        <AnnouncementBanner />
        <Content id="scrollableDiv" className='md:mt-[65px]'>
          <Outlet />
        </Content>
      </Layout>
    </>
  )
}
