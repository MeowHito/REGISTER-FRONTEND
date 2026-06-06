import React, { useEffect, useState } from "react";
import { Table, Button, Tag, Input, Space, Spin } from "antd";
import {
  LeftOutlined,
  DeleteOutlined,
  SearchOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import backOfficeServices from "services/backoffice.services";
import fileService from 'services/file.services';
import { AlertSuccess, AlertError, AlertConfirm } from "components/alert";
import { errorToMessage } from "hooks/functions/errorToMessage";
import Highlighter from "react-highlight-words";
import dayjs from "dayjs";
import useMe from "hooks/useMe";

const CouponDetails = ({ coupon: bucketName, onBack }) => {
  const { t } = useTranslation();
  const [coupons, setCoupons] = useState([]);
  const [totalData, setTotalData] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [order, setOrder] = useState("desc");
  const [sortedField, setSortedField] = useState(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    data: me
  } = useMe({ retry: 0 });
  const roleUser = me?.role?.roleType;

  const { mutate: couponDownload, isPending: isLoadingCouponDownload } = fileService.useMutationDownloadCouponDetails(bucketName);

  const { data: eventData, isFetching: isLoadingEventData } =
    backOfficeServices.useQueryGetAllActiveEvents({});

  const {
    data: couponDetailsData,
    isFetching: isLoadingCouponData,
    refetch: refetchCouponDetails,
    error: couponDetailsError,
  } = backOfficeServices.useQueryGetCouponDetails({
    bucketName,
    paging: {
      page: page - 1,
      size,
      sortField: sortedField,
      sortDirection: order,
    },
  });

  useEffect(() => {
    if (couponDetailsData && eventData?.content?.length > 0) {
      const eventMap = new Map();
      eventData.content.forEach((event) => {
        eventMap.set(event.id, event.name);
      });

      const mappedCoupons = couponDetailsData.content.map((coupon) => ({
        ...coupon,
        eventName: eventMap.get(coupon.eventId) || "",
      }));
      setCoupons(mappedCoupons);
      setTotalData(couponDetailsData.totalElements);
    }
  }, [couponDetailsData, eventData]);

  useEffect(() => {
    if (couponDetailsError) {
      console.error("ERR : ", couponDetailsError);
    }
  }, [couponDetailsError]);

  useEffect(() => {
    if (eventData?.content?.length > 0 && bucketName) {
      refetchCouponDetails();
    }
  }, [eventData, bucketName, page, size, sortedField, order]);

  const { mutate: deleteCoupon } = backOfficeServices.useMutationDeleteCoupon(
    () => {
      AlertSuccess({ text: t("back.couponList.deleteSuccess") });
    },
    (err) => {
      AlertError({ text: errorToMessage(err) });
    }
  );

  const isLoadingDetails = isLoadingCouponData || isLoadingEventData;

  const handleDelete = (record) => {
    if (roleUser !== "admin") return;

    AlertConfirm({
      text: t("back.couponList.deleteConfirm"),
      onOk: () => {
        const idsToDelete =
          selectedRowKeys.length > 0 ? selectedRowKeys : [record.id];
        setIsDeleting(true);
        deleteCoupon(
          { ids: idsToDelete },
          {
            onSuccess: () => {
              const updatedCoupons = coupons.filter(
                (coupon) => !idsToDelete.includes(coupon.id)
              );
              setCoupons(updatedCoupons);
              setSelectedRowKeys([]);
              refetchCouponDetails();
              setIsDeleting(false);
            },
            onError: (err) => {
              AlertError({ text: errorToMessage(err) });
              setIsDeleting(false);
            },
          }
        );
      },
    });
  };

  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    getCheckboxProps: (record) => ({
      disabled: !!record.redeemTime,
    }),
  };

  const handleChange = (pagination, filters, sorter) => {
    setOrder(sorter.order == "descend" ? "desc" : "asc");
    setSortedField(sorter.field);
  };

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            {t("back.couponList.search")}
          </Button>
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            {t("back.couponList.reset")}
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      (record[dataIndex]?.toString().toLowerCase() || '').includes(value.toLowerCase()),
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#188fff55", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={String(text ?? "")}
        />
      ) : (
        text ?? ""
      ),
  });

  const columns = [
    {
      key: "index",
      width: 50,
      render: (_text, _record, index) => {
        return totalData - ((page - 1) * size) - index;
      }
    },
    {
      title: t("back.couponList.eventName"),
      dataIndex: "eventName",
      key: "eventName",
      sorter: true,
      search: true,
    },
    {
      title: t("back.couponList.couponName"),
      dataIndex: "couponName",
      key: "couponName",
      sorter: true,
      search: true,
    },
    {
      title: t("back.couponList.code"),
      dataIndex: "couponCode",
      key: "couponCode",
      sorter: true,
      search: true,
    },
    {
      title: t("back.couponList.deductionPercentage"),
      dataIndex: "deductionPercentage",
      key: "deductionPercentage",
      render: (percent) => `${percent}%`,
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
      title: t("back.couponList.redeemBy"),
      dataIndex: "redeemByName",
      key: "redeemByName",
      search: true,
    },
    {
      title: t("back.couponList.redeemDate"),
      dataIndex: "redeemTime",
      key: "redeemTime",
      sorter: true,
      render: (value) =>
        value ? dayjs(value).format("DD/MM/YYYY HH:mm") : null,
    },
    {
      title: t("back.couponList.status"),
      key: "status",
      render: (_, record) => {
        const now = dayjs();
        const expiry = record.expiryTime ? dayjs(record.expiryTime) : null;
        const redeemed = record.redeemTime;

        let status = "notStarted";
        let color = "green";

        if (redeemed) {
          status = "used";
          color = "orange";
        } else if (expiry && now.isAfter(expiry)) {
          status = "expired";
          color = "red";
        }

        return <Tag color={color}>{t(`back.couponList.${status}`)}</Tag>;
      },
    },
  ];

  return (
    <Spin spinning={isLoadingDetails}>
      <div className="mb-4">
        <Button
          type="link"
          className="center"
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
        >
          <LeftOutlined size={22} className="me-2" />
          <p>{t("back.couponList.back")}</p>
        </Button>
      </div>
      <div className="pb-2 w-full flex flex-row justify-between">
        <div className="text-xl font-semibold opacity-60">
          {t("back.couponList.details")} ({totalData || 0})
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="primary"
            className="w-full h-full center"
            icon={<DownloadOutlined />}
            onClick={!isLoadingCouponDownload ? couponDownload : null}
            loading={isLoadingCouponDownload}
          >
            {t("back.couponList.downloadCoupon")}
          </Button>
          {roleUser === "admin" && (
            <Button
              danger
              className="w-full h-full center"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete()}
              disabled={selectedRowKeys.length === 0}
              loading={isDeleting}
            >
              {t("back.couponList.delete")}
            </Button>
          )}
        </div>
      </div>
      <Table
        className="text-nowrap"
        rowKey={(record) => record.id}
        dataSource={coupons}
        columns={columns.map((column) => ({
          ...column,
          ...(column.search && getColumnSearchProps(column.dataIndex)),
        }))}
        rowSelection={roleUser === "admin" ? rowSelection : undefined}
        onChange={handleChange}
        scroll={{ x: "max-content" }}
        pagination={{
          pageSize: size,
          current: page,
          onChange: (page, pageSize) => {
            setPage(page);
            setSize(pageSize);
          },
          total: totalData,
          pageSizeOptions: ["5", "10", "20", "50", "100"],
          showSizeChanger: true,
        }}
      />
    </Spin>
  );
};

export default CouponDetails;
