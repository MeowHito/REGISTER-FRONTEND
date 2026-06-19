import { Layout, Spin } from 'antd'
import { Content } from 'antd/es/layout/layout'
import Header from 'components/header'
import AnnouncementBanner from 'components/announcementBanner'
import React from 'react'
import { useSelector } from 'react-redux'
import { Outlet, useLocation } from 'react-router-dom'
import { isFullWidthPath } from 'utils'

export default function MainLayout() {
  const loading = useSelector((state) => state.loading.loading);
  const { pathname } = useLocation();
  const isFullWidth = isFullWidthPath(pathname);
  return (
    <>
      {loading &&
        <div className="flex justify-center items-center h-screen w-screen bg-black opacity-50 absolute z-50">
          <Spin className="center" />
        </div>
      }
      <Layout className={`min-h-screen mx-auto ${isFullWidth ? 'w-full' : 'md:max-w-[1200px]'}`}>
        <Header />
        <AnnouncementBanner />
        <Content id="scrollableDiv">
          <Outlet />
        </Content>
      </Layout>
    </>
  )
}
