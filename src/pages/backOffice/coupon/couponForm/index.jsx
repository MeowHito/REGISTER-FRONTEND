import React, { useEffect, useState } from "react";
import {
  Modal,
  Checkbox,
  Row,
  Col,
  Button,
  Popover,
  Radio,
  message,
  Space,
  Spin,
} from "antd";
import CommonForm from "components/commonForm";
import { useTranslation } from "react-i18next";
import {
  AlertConfirm,
  AlertSuccess,
  AlertError,
  AlertClosed,
} from "components/alert";
import { UploadOutlined } from "@ant-design/icons";
import { useMediaQuery } from "react-responsive";
import CouponFormUpload from "../couponFormUpload";
import backOfficeServices from "services/backoffice.services";
import { errorToMessage } from "hooks/functions/errorToMessage";
import dayjs from "dayjs";
import FloatingLabel from "components/floatingLabel";

const CouponForm = ({
  isEditable,
  data,
  open,
  onCancel,
  refetch,
  mode,
  roleUser,
  setIsSubmitting,
}) => {
  const { t } = useTranslation();
  const [form] = CommonForm.useForm();
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [customerType, setCustomerType] = useState("general");
  const [idData, setIdData] = useState([]);
  const [isReusable, setIsReusable] = useState(false);
  const [eventOption, setEventOption] = useState([]);
  const isAdmin = roleUser === "admin";

  const openUploadModal = () => {
    setUploadModalVisible(true);
  };

  const closeUploadModal = () => {
    setUploadModalVisible(false);
  };

  const { data: eventData, isFetching: isLoadingEventData } = backOfficeServices.useQueryGetAllActiveEvents({});

  useEffect(() => {
    if (eventData?.content) {
      const options = eventData.content.map(({ id, name }) => ({
        value: id,
        label: name,
      }));
      setEventOption(options);
    }
  }, [eventData]);

  const {
    data: couponData,
    refetch: refetchCoupon,
    isFetching: isLoadingCouponData,
  } = backOfficeServices.useQueryGetCouponByBucketName({
    id: data?.bucketName,
  });

  useEffect(() => {
    if (open && mode === "edit") {
      if (couponData) {
        form.setFieldsValue({
          ...couponData,
          startTime: couponData.startTime ? dayjs(couponData.startTime) : undefined,
          expiryTime: couponData.expiryTime ? dayjs(couponData.expiryTime) : undefined,
        });
      }
    } else if (open && mode === "create") {
      form.resetFields();
    } else if (!open) {
      form.resetFields();
    }
  }, [open, mode, couponData]);

  const { mutate: updateCoupon, isPending: isUpdatingCoupon } =
    backOfficeServices.useMutationUpdateCoupon(
      (res) => {
        const { success, message } = res;
        if (success) {
          refetch();
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

  const { mutate: createCoupon, isPending: isCreatingCoupon } =
    backOfficeServices.useMutationCreateCoupon(
      (res) => {
        const { success, message } = res;
        if (success) {
          form.resetFields();
          AlertClosed();
          onCancel();
          refetch();
          AlertSuccess({});
        } else {
          AlertError({ text: message });
        }
      },
      (err) => {
        AlertClosed();
        onCancel();
        AlertError({
          text: errorToMessage(err?.response?.data?.message || err),
        });
      }
    );

  const isLoading = isLoadingCouponData || isLoadingEventData;

  const isSubmitting = isCreatingCoupon || isUpdatingCoupon;

  const handleFinish = (values) => {
    AlertConfirm({
      onOk: () => {
        if (customerType === "external" && (!idData || idData.length === 0)) {
          message.error(t("required.file"));
          return;
        }
        const typeMapping = {
          internal: "internal",
          external: "external",
          general: isReusable === true ? "reusable" : "non reusable",
        };
        const type = typeMapping[customerType];
        const updatedCoupon = {
          ...data,
          ...values,
          startTime: values?.startTime ? dayjs(values.startTime).toISOString() : null,
          expiryTime: values?.expiryTime ? dayjs(values.expiryTime).toISOString() : null,
        };
        const createdCoupon = {
          ...data,
          ...values,
          startTime: values?.startTime ? dayjs(values.startTime).toISOString() : null,
          expiryTime: values?.expiryTime ? dayjs(values.expiryTime).toISOString() : null,
          type,
          runnerIds: customerType === "external" ? idData : undefined,
        };
        if (data?.id) {
          setIsSubmitting?.(data.id);
          updateCoupon(updatedCoupon, {
            onSettled: () => {
              setIsSubmitting?.(null);
              onCancel();
            },
          });
        } else {
          setIsSubmitting?.("create");
          createCoupon(createdCoupon, {
            onSettled: () => {
              setIsSubmitting?.(null);
              onCancel();
            },
          });
        }
      }
    });
  };

  const handleUploadedIdData = (customerId) => {
    if (Array.isArray(customerId) && customerId.length > 0) {
      setIdData(customerId);
    }
  };

  const handleCustomerTypeChange = (type) => {
    if (type === "internal") {
      setCustomerType("internal");
      form.resetFields(["oldEventName", "limitCoupon"]);
    } else if (type === "external") {
      setCustomerType("external");
      form.resetFields(["oldEventId", "limitCoupon"]);
    } else if (type === "general") {
      setCustomerType("general");
      form.resetFields(["oldEventId", "oldEventName"]);
      form.setFieldsValue({ isReusable: false });
    } else {
      setCustomerType(null);
    }
  };

  return (
    <div>
      <Modal
        title={
          mode === "create"
            ? t("back.couponList.create")
            : mode === "edit"
            ? t("back.couponList.edit")
            : t("back.couponList.view")
        }
        open={open}
        okButtonProps={{
          disabled: !isEditable || !isAdmin,
          loading: isSubmitting,
        }}
        onOk={() => {
          form.submit();
        }}
        onCancel={() => {
          if (!data) {
            form.resetFields();
          }
          onCancel();
        }}
        okText={t("back.couponList.buttonSave")}
        cancelText={t("back.couponList.buttonCancel")}
      >
        <Spin spinning={isLoading}>
          <CommonForm
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={{
              customerType: "general",
              isReusable: false,
            }}
          >
            <CommonForm.Item
              name="eventId"
              rules={[
                {
                  required: true,
                  message: t("required.event"),
                },
              ]}
              className="!mb-7"
            >
              <FloatingLabel
                label={t("back.couponList.eventName")}
                type="select"
                options={eventOption}
                allowClear
                required
              />
            </CommonForm.Item>
            <CommonForm.Item
              name="couponName"
              rules={[
                {
                  required: true,
                  message: t("required.couponName"),
                },
              ]}
              className="!mb-7"
            >
              <FloatingLabel
                label={t("back.couponList.couponName")}
                type="text"
                required
              />
            </CommonForm.Item>
            {mode === "edit" && (
              <CommonForm.Item
                name="limitCoupon"
                rules={[
                  {
                    validator: (_, value) => {
                      const minValue = couponData?.limitCoupon;
                      if (minValue === undefined) {
                        return Promise.reject(
                          new Error(t("back.couponList.limitCouponLoadingError") || "Data not loaded")
                        );
                      }
                      if (value === undefined || value === null || value === "") {
                        return Promise.reject(
                          new Error(
                            t("back.couponList.limitCouponValidation", { min: minValue })
                          )
                        );
                      }
                      if (value < minValue) {
                        return Promise.reject(
                          new Error(
                            t("back.couponList.limitCouponValidation", { min: minValue })
                          )
                        );
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
                className="!mb-7"
              >
                <FloatingLabel
                  label={t("back.couponList.limitCoupon")}
                  type="number"
                  min={1}
                  readOnly={couponData?.type !== "reusable" && couponData?.type !== "non reusable"}
                  required
                />
              </CommonForm.Item>
            )}
            <CommonForm.Item
              name="deductionPercentage"
              rules={[
                {
                  required: true,
                  message: t("required.deductionPercentage"),
                },
              ]}
              className="!mb-7"
            >
              <FloatingLabel
                label={t("back.couponList.deductionPercentage")}
                type="number"
                min={0}
                max={100}
                required
              />
            </CommonForm.Item>
            <CommonForm.Item
              name="startTime"
              rules={[
                {
                  required: true,
                  message: t("required.startTime"),
                },
              ]}
              className="!mb-7"
            >
              <FloatingLabel
                label={t("back.couponList.startTime")}
                type="date"
                showTime
                required
              />
            </CommonForm.Item>
            <CommonForm.Item
              name="expiryTime"
              rules={[
                {
                  required: true,
                  message: t("required.expiryTime"),
                },
              ]}
              className={mode === "edit" ? "!mb-7" : undefined}
            >
              <FloatingLabel
                label={t("back.couponList.expiryTime")}
                type="date"
                showTime
                required
              />
            </CommonForm.Item>
            {mode === "edit" && (
              <CommonForm.Item name="status" className="!mb-7">
                <FloatingLabel
                  label={t("back.couponList.status")}
                  type="text"
                  readOnly={true}
                  required
                />
              </CommonForm.Item>
            )}
            {mode === "edit" && (
              <CommonForm.Item
                name="active"
                rules={[
                  {
                    required: true,
                    message: t("required.active"),
                  },
                ]}
                className="!mb-7"
              >
                <FloatingLabel
                  label={t("back.couponList.couponActive")}
                  type="select"
                  options={[
                    {
                      label: t("back.couponList.active"),
                      value: true,
                    },
                    {
                      label: t("back.couponList.inactive"),
                      value: false,
                    },
                  ]}
                  allowClear
                  required
                />
              </CommonForm.Item>
            )}
            {mode === "create" && (
              <>
                <span style={{ fontSize: "16px" }}>
                  {t("back.couponList.condition")}
                </span>
                <CommonForm.Item name="internal" style={{ marginBottom: 5 }}>
                  <Checkbox
                    checked={customerType === "internal"}
                    onChange={() => handleCustomerTypeChange("internal")}
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <span>
                      {t("back.couponList.couponFor")}{" "}
                      {t("back.couponList.internal")}
                    </span>
                  </Checkbox>
                </CommonForm.Item>
                <CommonForm.Item
                  name="oldEventId"
                  rules={[
                    {
                      required: customerType === "internal",
                      message: t("required.event"),
                    },
                  ]}
                >
                  <FloatingLabel
                    type="select"
                    min={1}
                    label={t("back.couponList.selectEventName")}
                    allowClear
                    disabled={customerType !== "internal"}
                    options={eventOption}
                    required
                  />
                </CommonForm.Item>
                <CommonForm.Item name="external" style={{ marginBottom: 0 }}>
                  <Checkbox
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                    checked={customerType === "external"}
                    onChange={() => handleCustomerTypeChange("external")}
                  >
                    <span>
                      {t("back.couponList.couponFor")}{" "}
                      {t("back.couponList.external")}
                    </span>
                  </Checkbox>
                </CommonForm.Item>
                <Space.Compact style={{ width: "100%" }}>
                  <CommonForm.Item
                    name="oldEventName"
                    style={{ width: "calc(100% - 32px)" }}
                    rules={[
                      {
                        required: customerType === "external",
                        message: t("required.event"),
                      },
                    ]}
                  >
                    <FloatingLabel
                      type="text"
                      min={1}
                      style={{
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                      }}
                      label={t("back.couponList.eventName")}
                      disabled={customerType !== "external"}
                      required
                    />
                  </CommonForm.Item>
                  <CommonForm.Item name="customerId">
                    <Popover
                      content={t("back.couponList.uploadExcel")}
                      trigger={isMobile ? "none" : "hover"}
                    >
                      <Button
                        className="center tw-gap-1"
                        style={{
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                          height: "40px",
                          width: "40px",
                        }}
                        icon={<UploadOutlined />}
                        disabled={customerType !== "external"}
                        onClick={openUploadModal}
                      />
                    </Popover>
                  </CommonForm.Item>
                </Space.Compact>
              </>
            )}
            {mode === "create" && (
              <>
                <CommonForm.Item name="general" style={{ marginBottom: 0 }}>
                  <Checkbox
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                    checked={customerType === "general"}
                    onChange={() => handleCustomerTypeChange("general")}
                  >
                    <span>
                      {t("back.couponList.couponFor")}{" "}
                      {t("back.couponList.general")}
                    </span>
                  </Checkbox>
                </CommonForm.Item>
                <Row align="top" gutter={16}>
                  <Col flex="2">
                    <CommonForm.Item
                      name="reusable"
                      initialValue={false}
                      style={{ marginBottom: 0 }}
                    >
                      <Radio.Group
                        buttonStyle="solid"
                        disabled={customerType !== "general"}
                        value={isReusable}
                        onChange={(e) => setIsReusable(e.target.value)}
                        style={{ display: "flex" }}
                      >
                        <Radio.Button
                          value={false}
                          style={{
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 16px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "120px",
                          }}
                        >
                          {t("back.couponList.nonReusable")}
                        </Radio.Button>
                        <Radio.Button
                          value={true}
                          style={{
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0 16px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "90px",
                          }}
                        >
                          {t("back.couponList.reusable")}
                        </Radio.Button>
                      </Radio.Group>
                    </CommonForm.Item>
                  </Col>

                  <Col flex="3">
                    <CommonForm.Item
                      name="limitCoupon"
                      rules={[
                        {
                          required: customerType === "general",
                          message: t("required.limitCoupon"),
                        },
                      ]}
                    >
                      <FloatingLabel
                        type="number"
                        min={1}
                        disabled={customerType !== "general"}
                        label={t("back.couponList.limitCoupon")}
                        required
                      />
                    </CommonForm.Item>
                  </Col>
                </Row>
              </>
            )}
          </CommonForm>
        </Spin>
      </Modal>
      <CouponFormUpload
        open={uploadModalVisible}
        onCancel={closeUploadModal}
        onUploadSuccess={handleUploadedIdData}
      />
    </div>
  );
};

export default CouponForm;

