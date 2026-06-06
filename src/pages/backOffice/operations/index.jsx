import React from "react";
import { Tabs } from "antd";
import { useTranslation } from "react-i18next";
import HelpRequestList from "pages/backOffice/helpRequests";
import JobMonitoring from "pages/backOffice/setting/jobMonitoring";
import EmailQueue from "pages/backOffice/emailQueue";

export default function Operations() {
  const { t } = useTranslation();

  const items = [
    {
      key: "1",
      label: t("back.operations.tab.helpRequests"),
      children: <HelpRequestList />,
    },
    {
      key: "2",
      label: t("back.operations.tab.jobMonitoring"),
      children: <JobMonitoring />,
    },
    {
      key: "3",
      label: t("back.operations.tab.emailQueue"),
      children: <EmailQueue />,
    },
  ];

  return <Tabs items={items} defaultActiveKey="1" destroyOnHidden />;
}
