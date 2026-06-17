import { ConfigProvider, Tabs } from 'antd'
import React from 'react'
import DashboardRegistration from './dashboardRegistration';
import DashboardOverview from './dashboardOverview';
import { useTranslation } from 'react-i18next';
import { COLOR } from 'constants/color';

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
    <ConfigProvider
      theme={{
        token: { borderRadiusLG: 12 },
        components: {
          Card: { borderRadiusLG: 12, paddingLG: 20, colorBorderSecondary: "#eef0f4" },
          Tabs: {
            titleFontSize: 15,
            horizontalItemGutter: 28,
            inkBarColor: COLOR.primary,
            itemSelectedColor: COLOR.primary,
            itemHoverColor: COLOR.primary,
          },
        },
      }}
    >
      <div className="dashboard-modern">
        <div className="dashboard-header">
          <h1 className="dashboard-title">{t("back.menu.dashboard.name")}</h1>
          <p className="dashboard-subtitle">{t("back.menu.dashboard.desc")}</p>
        </div>
        <Tabs items={items} defaultActiveKey='1' />
      </div>
    </ConfigProvider>
  )
}
