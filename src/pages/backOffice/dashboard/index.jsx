import { Tabs } from 'antd'
import React from 'react'
import DashboardRegistration from './dashboardRegistration';
import DashboardOverview from './dashboardOverview';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();

  const items = [
    {
      key: "1",
      label: t("back.dashboard.overview"),
      children: <DashboardOverview />
    },
    {
      key: "2",
      label: t("back.dashboard.registrationInfo"),
      children: <DashboardRegistration />
    }
  ]
  return (
    <Tabs  items={items} defaultActiveKey='1'/>
  )
}
