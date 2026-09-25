import { Tabs } from 'antd'
import React from 'react'
import { useTranslation } from 'react-i18next';
import useActiveEvent from 'hooks/useActiveEvent';
import DashboardOverview from 'pages/backOffice/dashboard/dashboardOverview';
import DashboardRegistration from 'pages/backOffice/dashboard/dashboardRegistration';

// Full-bleed page (see fullBleed in backOfficeLayout): no title, the tabs start at the top.
export default function EventStats() {
  const { t } = useTranslation();
  const { activeEvent } = useActiveEvent();

  // With an event starred the stats follow it; otherwise each tab keeps its own picker.
  const items = [
    {
      key: "1",
      label: t("back.dashboard.overview"),
      children: <DashboardOverview eventId={activeEvent?.id} />
    },
    {
      key: "2",
      label: t("back.dashboard.registrationInfo"),
      children: <DashboardRegistration eventId={activeEvent?.id} eventName={activeEvent?.name} />
    }
  ]
  return (
    <div className="dashboard-modern !max-w-none w-full flex-1">
      <Tabs className="bo-tabs" items={items} defaultActiveKey='1' />
    </div>
  )
}
