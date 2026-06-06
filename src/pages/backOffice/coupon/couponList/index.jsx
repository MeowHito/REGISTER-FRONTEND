import React, { useEffect, useMemo, useState } from "react";
import { Button, Tag, Spin } from "antd";
import { AppstoreAddOutlined, CheckOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import CouponForm from "../couponForm";
import backOfficeServices from "services/backoffice.services";
import { AlertSuccess, AlertError, AlertConfirm } from "components/alert";
import { errorToMessage } from "hooks/functions/errorToMessage";
import { handleQueryStatus } from "utils";
import CouponDetails from "../couponDetails";
import useMe from "hooks/useMe";
import PermissionActionTable from "components/permissionActionTable";

const VIEWS = {
  LIST: "list",
  DETAILS: "details",
};

const CouponList = () => {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [editCoupon, setEditCoupon] = useState(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [totalData, setTotalData] = useState(0);
  const [order, setOrder] = useState("desc");
  const [sortedField, setSortedField] = useState(undefined);
  const [view, setView] = useState(VIEWS.LIST);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [isApproving, setIsApproving] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setIsDeleting] = useState(null);

  const { data: me } = useMe({ retry: 0 });
  const roleUser = me?.role?.roleType;

  const dataWithPerm = useMemo(
    () =>
      (coupons ?? []).map((coupon) => ({
        ...coupon,
        canDelete: roleUser === "admin" && coupon?.status === "new",
      })),
    [coupons, roleUser]
  );

  const { data: eventData, isFetching: isLoadingEventData } =
    backOfficeServices.useQueryGetAllActiveEvents({});

  const {
    data: couponData,
    refetch: refetchCoupon,
    isFetching: isLoadingCouponData,
    ...other
  } = backOfficeServices.useQueryGetAllCoupon({
    paging: {
      page: page - 1,
      size,
      sortField: sortedField,
      sortDirection: order,
    },
  });

  useEffect(() => {
    handleQueryStatus(other, () => {
      if (couponData) {
        setCoupons(couponData.content);
        setTotalData(couponData.totalElements);
      }
    });
  }, [other.fetchStatus, couponData]);

  const { mutate: updateCouponStatus } =
    backOfficeServices.useMutationUpdateCouponStatus(
      (res) => {
        const { success, message } = res;
        if (success) {
          refetchCoupon();
        } else {
          AlertError({ text: message });
        }
        AlertSuccess({});
      },
      (err) => {
        AlertError({ text: errorToMessage(err) });
      }
    );

  const { mutate: deleteCouponByBucketName } =
    backOfficeServices.useMutationDeleteCouponByBucketName(
      () => {
        AlertSuccess({ text: t("back.couponList.deleteSuccess") });
        refetchCoupon();
      },
      (err) => {
        AlertError({ text: errorToMessage(err) });
      }
    );

  const openModal = (coupon, mode) => {
    setEditCoupon(coupon);
    setMode(mode);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setMode(null);
  };

  const handleApprove = async (bucketName) => {
    setIsApproving(bucketName);
    updateCouponStatus(
      { bucketName, status: "approved" },
      {
        onSettled: () => {
          setIsApproving(null);
        },
      }
    );
  };

  const handleDelete = (record) => {
    if (roleUser !== "admin") return;

    AlertConfirm({
      text: t("back.couponList.deleteConfirm"),
      onOk: () => {
        setIsDeleting(record.bucketName);
        deleteCouponByBucketName(record.bucketName, {
          onSuccess: () => {
            setIsDeleting(null);
          },
          onError: (err) => {
            AlertError({ text: errorToMessage(err) });
            setIsDeleting(null);
          },
        });
      },
    });
  };

  const handleChange = (pagination, filters, sorter) => {
    setOrder(sorter.order === "descend" ? "desc" : "asc");
    setSortedField(sorter.field);
  };

  const columns = [
    {
      key: "index",
      width: 50,
      render: (_text, _record, index) => {
        return totalData - (page - 1) * size - index;
      },
    },
    {
      title: t("back.couponList.eventName"),
      dataIndex: "eventId",
      key: "eventId",
      sorter: true,
      render: (eventId) => {
        const event = eventData?.content?.find((e) => e.id === eventId);
        return event ? event.name : eventId;
      },
    },
    {
      title: t("back.couponList.couponName"),
      dataIndex: "couponName",
      key: "couponName",
    },
    {
      title: t("back.couponList.deductionPercentage"),
      dataIndex: "deductionPercentage",
      key: "deductionPercentage",
      render: (percent) => `${percent}%`,
    },
    {
      title: t("back.couponList.limitCoupon"),
      dataIndex: "limitCoupon",
      key: "limitCoupon",
      render: (_, record) => `${record.usedCoupon}/${record.limitCoupon}`,
    },
    {
      title: t("back.couponList.startTime"),
      dataIndex: "startTime",
      key: "startTime",
      render: (value) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : null,
    },
    {
      title: t("back.couponList.expiryTime"),
      dataIndex: "expiryTime",
      key: "expiryTime",
      render: (value) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : null,
    },
    {
      title: t("back.couponList.status"),
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (_, record) => {
        const status =
          record.status === "redeemed" ? "approved" : record.status;

        return (
          <Tag color={status === "approved" ? "green" : "orange"}>
            {t(`back.couponList.${status}`)}
          </Tag>
        );
      },
    },
  ];

  const renderSection = () => {
    switch (view) {
      case VIEWS.LIST:
        return (
          <PermissionActionTable
            rowKey="id"
            className="text-nowrap"
            columns={columns}
            dataSource={dataWithPerm}
            bordered
            scroll={{ x: "max-content" }}
            pagination={{
              pageSize: size,
              current: page,
              onChange: (p, ps) => {
                setPage(p);
                setSize(ps);
              },
              total: totalData,
              pageSizeOptions: ["5", "10", "20", "50", "100"],
              showSizeChanger: true,
            }}
            onChange={handleChange}
            rawId="couponList"
            totalText={t("back.couponList.allCoupons")}
            totalData={totalData}
            createButtonText={t("back.couponList.create")}
            customCreate={
              <Button
                type="primary"
                icon={<AppstoreAddOutlined />}
                onClick={() => openModal(null, "create")}
                loading={isSubmitting === "create"}
              >
                {t("back.couponList.create")}
              </Button>
            }
            onView={(record) => {
              setSelectedCoupon(record.bucketName);
              setView(VIEWS.DETAILS);
            }}
            onEdit={(record) => openModal(record, "edit")}
            onDelete={(record) => handleDelete(record)}
            recordPermission={true}
            extraPosition="start"
            extraActions={(record) =>
              [
                roleUser === "admin" && record?.status === "new" && (
                  <Button
                    key="approve"
                    type="link"
                    icon={<CheckOutlined />}
                    onClick={() => handleApprove(record.bucketName)}
                    loading={isApproving === record.bucketName}
                  >
                    {t("back.couponList.approve")}
                  </Button>
                ),
              ].filter(Boolean)
            }
          />
        );

      case VIEWS.DETAILS:
        return (
          <CouponDetails
            coupon={selectedCoupon}
            onBack={() => {
              setSelectedCoupon(null);
              setView(VIEWS.LIST);
              refetchCoupon();
            }}
          />
        );

      default:
        return null;
    }
  };

  const isLoading = isLoadingCouponData || isLoadingEventData;

  return (
    <Spin spinning={isLoading}>
      <div>
        {renderSection()}
        <CouponForm
          isEditable={mode === "create" || mode === "edit"}
          data={editCoupon}
          open={modalVisible}
          onCancel={closeModal}
          refetch={refetchCoupon}
          mode={mode}
          roleUser={roleUser}
          setIsSubmitting={setIsSubmitting}
        />
      </div>
    </Spin>
  );
};

export default CouponList;

