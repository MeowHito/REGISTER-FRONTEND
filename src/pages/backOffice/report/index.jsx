import { Tabs } from 'antd'
import React from 'react'
import { useTranslation } from 'react-i18next';
import FinanceSummary from './financeSummary';
import RevenueSummary from './revenueSummary';
import ParticipantSummary from './participantSummary';
import RevenueDetailSummary from './revenueDetailSummary';
import useMe from 'hooks/useMe';

export default function Report() {
    const { t } = useTranslation();
    const items = [];

    const {
        data: me
    } = useMe({ retry: 0 });
    const roleUser = me?.role?.roleType;

    if (roleUser === "admin") {
        items.push(
            {
                key: "1",
                label: t("back.report.revenue"),
                children: <RevenueSummary />
            },
            {
                key: "2",
                label: t("back.report.revenueDetail"),
                children: <RevenueDetailSummary />
            },
        );
    }

    items.push(
        {
            key: "3",
            label: t("back.report.summary"),
            children: <FinanceSummary />
        },
        {
            key: "4",
            label: t("back.report.participant"),
            children: <ParticipantSummary />
        }
    );

    return (
        <Tabs items={items} defaultActiveKey={roleUser === "admin" ? "1" : "2"} />
    )
}
