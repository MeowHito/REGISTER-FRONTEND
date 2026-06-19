import React, { useMemo } from "react";
import { Button, Empty, Table, Tag, message } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import backOfficeServices from "services/backoffice.services";

export default function PendingOrganizers() {
  const { t } = useTranslation();

  const { data, isFetching, refetch } = backOfficeServices.useQueryGetPendingUsers();

  const { mutate: updateStatus, isPending: isApproving } =
    backOfficeServices.useMutationUpdateUserStatus(
      () => {
        message.success(t("back.operations.pendingOrganizers.approved"));
        refetch();
      },
      () => {
        message.error(t("general.somethingWrong"));
      }
    );

  const organizers = useMemo(() => {
    const list = data?.content || (Array.isArray(data) ? data : []);
    return list.filter((u) => u.roleType === "organizer");
  }, [data]);

  const handleApprove = (record) => {
    updateStatus({ id: record.id, active: true });
  };

  const columns = [
    {
      title: t("back.operations.pendingOrganizers.name"),
      key: "name",
      render: (_, r) => `${r.firstName || ""} ${r.lastName || ""}`.trim() || "-",
    },
    {
      title: t("back.operations.pendingOrganizers.company"),
      dataIndex: "companyName",
      key: "companyName",
      render: (v) => v || "-",
    },
    { title: t("general.email"), dataIndex: "email", key: "email" },
    {
      title: t("back.operations.pendingOrganizers.status"),
      key: "status",
      render: () => <Tag color="orange">{t("back.operations.pendingOrganizers.pending")}</Tag>,
    },
    {
      title: "",
      key: "action",
      align: "right",
      render: (_, r) => (
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={isApproving}
          onClick={() => handleApprove(r)}
        >
          {t("back.operations.pendingOrganizers.approve")}
        </Button>
      ),
    },
  ];

  return (
    <div className="p-2 md:p-4">
      <Table
        rowKey="id"
        loading={isFetching}
        columns={columns}
        dataSource={organizers}
        pagination={false}
        locale={{ emptyText: <Empty description={t("back.operations.pendingOrganizers.empty")} /> }}
        scroll={{ x: "max-content" }}
      />
    </div>
  );
}
