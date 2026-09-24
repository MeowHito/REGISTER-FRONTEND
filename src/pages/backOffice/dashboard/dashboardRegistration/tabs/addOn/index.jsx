import React, { useMemo } from "react";
import { Empty, Progress, Table, Tag } from "antd";
import { DollarOutlined, GiftOutlined, ShoppingOutlined } from "@ant-design/icons";
import numeral from "numeral";
import StatCard from "components/statCard";

/** Add-on sales for the selected event: units sold, units held by unpaid orders, quota left, revenue. */
const AddOn = ({ t, dashboardData }) => {
  const rows = dashboardData?.addOnSales || [];

  const totals = useMemo(
    () => rows.reduce(
      (acc, r) => ({ sold: acc.sold + (r.sold || 0), revenue: acc.revenue + (r.revenue || 0) }),
      { sold: 0, revenue: 0 }
    ),
    [rows]
  );

  if (!rows.length) {
    return (
      <div className="py-12">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t("back.dashboard.addOnEmpty")} />
      </div>
    );
  }

  const columns = [
    {
      title: t("back.dashboard.addOnName"),
      dataIndex: "name",
      key: "name",
      render: (name, r) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#1d1d1f]">{name}</span>
          {r.category && <Tag bordered={false} className="!m-0">{r.category}</Tag>}
        </div>
      ),
    },
    {
      title: t("back.dashboard.addOnMode"),
      dataIndex: "perApplicant",
      key: "perApplicant",
      render: (v) => (v ? t("back.dashboard.addOnPerApplicant") : t("back.dashboard.addOnPerOrder")),
    },
    {
      title: t("back.dashboard.addOnSold"),
      dataIndex: "sold",
      key: "sold",
      align: "right",
      render: (v) => <span className="font-semibold tabular-nums">{numeral(v || 0).format("0,0")}</span>,
    },
    {
      title: t("back.dashboard.addOnReserved"),
      dataIndex: "reserved",
      key: "reserved",
      align: "right",
      render: (v) => <span className="tabular-nums text-[#6e6e73]">{numeral(v || 0).format("0,0")}</span>,
    },
    {
      title: t("back.dashboard.addOnQuota"),
      key: "quota",
      width: 220,
      render: (_, r) => {
        if (r.quota === null || r.quota === undefined) {
          return <span className="text-[#6e6e73]">{t("back.dashboard.addOnUnlimited")}</span>;
        }
        const used = (r.sold || 0) + (r.reserved || 0);
        const left = Math.max(0, r.quota - used);
        return (
          <div>
            <div className="flex justify-between text-xs text-[#424245] tabular-nums">
              <span>{t("back.dashboard.addOnLeft", { left })}</span>
              <span>{used} / {r.quota}</span>
            </div>
            <Progress
              percent={r.quota ? Math.min(100, Math.round((used / r.quota) * 100)) : 0}
              showInfo={false}
              size="small"
              strokeColor={left === 0 ? "#ff3b30" : "#0071e3"}
            />
          </div>
        );
      },
    },
    {
      title: t("back.dashboard.addOnRevenue"),
      dataIndex: "revenue",
      key: "revenue",
      align: "right",
      render: (v) => <span className="font-semibold tabular-nums">฿{numeral(v || 0).format("0,0.00")}</span>,
    },
  ];

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label={t("back.dashboard.addOnCount")} value={rows.length} icon={<GiftOutlined />} tone="blue" />
        <StatCard label={t("back.dashboard.addOnSoldTotal")} value={numeral(totals.sold).format("0,0")} icon={<ShoppingOutlined />} tone="green" />
        <StatCard label={t("back.dashboard.addOnRevenueTotal")} value={`฿${numeral(totals.revenue).format("0,0")}`} icon={<DollarOutlined />} tone="orange" />
      </div>
      <div className="bo-card overflow-hidden">
        <Table
          className="bo-flush-table"
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={false}
          scroll={{ x: "max-content" }}
        />
      </div>
    </div>
  );
};

export default AddOn;
