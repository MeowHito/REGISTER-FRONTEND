import React from "react";
import { Tabs } from "antd";
import { useSearchParams } from "react-router-dom";
import PageHeader from "components/pageHeader";
import { useTranslation } from "react-i18next";
import HelpRequestList from "pages/backOffice/helpRequests";
import JobMonitoring from "pages/backOffice/setting/jobMonitoring";
import EmailQueue from "pages/backOffice/emailQueue";
import PendingOrganizers from "pages/backOffice/operations/PendingOrganizers";
import PaymentMismatch from "pages/backOffice/paymentMismatch";
import ResendConfirmation from "pages/backOffice/resendConfirmation";

// Tabs are addressable (?tab=helpRequests) so notifications can deep-link.
const TAB_KEYS = ["pendingOrganizers", "helpRequests", "jobMonitoring", "emailQueue", "paymentMismatch", "resendConfirmation"];

const inCard = (node) => <div className="bo-card bo-card-pad">{node}</div>;

export default function Operations() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("tab");
  const activeKey = TAB_KEYS.includes(requested) ? requested : "helpRequests";

  const items = [
    { key: "pendingOrganizers", label: t("back.operations.tab.pendingOrganizers"), children: inCard(<PendingOrganizers />) },
    { key: "helpRequests", label: t("back.operations.tab.helpRequests"), children: inCard(<HelpRequestList />) },
    { key: "jobMonitoring", label: t("back.operations.tab.jobMonitoring"), children: inCard(<JobMonitoring />) },
    { key: "emailQueue", label: t("back.operations.tab.emailQueue"), children: inCard(<EmailQueue />) },
    { key: "paymentMismatch", label: t("back.operations.tab.paymentMismatch"), children: <PaymentMismatch /> },
    { key: "resendConfirmation", label: t("back.operations.tab.resendConfirmation"), children: <ResendConfirmation /> },
  ];

  return (
    <>
      <PageHeader menu="operations" />
      <Tabs
        className="bo-tabs"
        items={items}
        activeKey={activeKey}
        onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
        destroyOnHidden
      />
    </>
  );
}
