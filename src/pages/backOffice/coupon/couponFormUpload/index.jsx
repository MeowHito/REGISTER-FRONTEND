import React, { useState } from "react";
import {
  Modal,
  Row,
  Col,
  Button,
  Table,
  message,
  Upload,
  Tabs,
} from "antd";
import CommonForm from "components/commonForm";
import { useTranslation } from "react-i18next";
import { AlertConfirm } from "components/alert";
import { DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import ExcelJS from "exceljs";

const CouponFormUpload = ({ open, onCancel, onUploadSuccess }) => {
  const { t } = useTranslation();
  const [form] = CommonForm.useForm();
  const [disableUploadSave, setDisableUploadSave] = useState(true);
  const [fileName, setFileName] = useState("");
  const [excelData, setExcelData] = useState([]);
  const [runnerIds, setRunnerIds] = useState([]);
  const [activeSheetKey, setActiveSheetKey] = useState(null);
  const [page, setPage] = useState(1);
  const [limitPage, setLimitPage] = useState(5);
  const [isUploading, setIsUploading] = useState(false);

  const props = {
    beforeUpload: async (file) => {
      const validateData = (data, sheetName) => {
        const validRows = [];
        const validatedData = data.map((row) => {
          const cleanedCustomerId = String(row.customerId || "").replace(
            /[\W_]/g,
            ""
          );
          const isEmptyId = cleanedCustomerId === "";
          const isInvalidCustomerId = /^[A-Za-z]+$/.test(cleanedCustomerId);

          const hasErrors =
            !row.firstName ||
            !row.lastName ||
            !row.customerId ||
            isEmptyId ||
            isInvalidCustomerId;

          if (hasErrors) {
            return {
              ...row,
              customerId:
                isEmptyId || isInvalidCustomerId
                  ? "Invalid ID Format"
                  : row.customerId,
              sheetName,
              error: true,
            };
          }

          validRows.push(cleanedCustomerId);
          return {
            ...row,
            customerId: cleanedCustomerId,
            sheetName,
            error: false,
          };
        });

        return {
          validatedData,
          validRows,
          hasErrors: validatedData.some((row) => row.error),
        };
      };

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const data = e.target.result;
          const workbook = new ExcelJS.Workbook();

          try {
            await workbook.xlsx.load(data);
          } catch {
            message.error(t("back.couponList.invalidFile"));
            setExcelData([]);
            setFileName("");
            setDisableUploadSave(true);
            return;
          }

          const allSheetsData = [];
          let combinedValidRows = [];
          let overallHasErrors = false;

          workbook.eachSheet((worksheet) => {
            const sheetName = worksheet.name;
            const rows = [];

            worksheet.eachRow((row) => {
              rows.push(row.values.slice(1));
            });

            if (rows.length <= 1) return;

            const headers = rows[0].map((h) =>
              String(h || "")
                .toLowerCase()
                .trim()
            );
            const dataRows = rows.slice(1);

            const formattedData = dataRows.map((row, index) => {
              const rowData = {};
              headers.forEach((header, i) => {
                rowData[header] = row[i] || "";
              });

              return {
                key: `${sheetName}-${index}`,
                firstName: rowData["ชื่อ"] || rowData["first name"] || "",
                lastName: rowData["นามสกุล"] || rowData["last name"] || "",
                customerId:
                  rowData["เลขบัตรประชาชน/เลขพาสปอร์ต"] ||
                  rowData["id no./passport no."] ||
                  "",
              };
            });

            const { validatedData, validRows, hasErrors } = validateData(
              formattedData,
              sheetName
            );

            combinedValidRows = [...combinedValidRows, ...validRows];
            overallHasErrors = overallHasErrors || hasErrors;
            allSheetsData.push({ sheetName, data: validatedData });
          });

          if (allSheetsData.length === 0) {
            message.error(t("back.couponList.noData"));
            setExcelData([]);
            setDisableUploadSave(true);
            return;
          }

          setExcelData(allSheetsData);
          setRunnerIds(combinedValidRows);
          setDisableUploadSave(overallHasErrors);
          setActiveSheetKey(allSheetsData[0]?.sheetName || null);
          setFileName(file.name);
        };

        reader.onerror = () => {
          message.error(t("back.couponList.uploadFailed"));
        };

        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Upload error:", error);
        message.error(t("back.couponList.uploadFailed"));
      }

      return false;
    },
    showUploadList: false,
  };

  const handleDownloadTemplate = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Runner");

    worksheet.columns = [
      { header: t("back.couponList.firstName"), key: "firstName", width: 20 },
      { header: t("back.couponList.lastName"), key: "lastName", width: 20 },
      { header: t("back.couponList.customerId"), key: "customerId", width: 30 },
    ];

    worksheet.addRow({ firstName: "", lastName: "", customerId: "" });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template.xlsx";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUpload = () => {
    AlertConfirm({
      onOk: () => {
        setIsUploading(true);
        onUploadSuccess(runnerIds);
        message.success(t("back.couponList.uploadSuccess"));
        onCancel();
      }
    });
  };

  const handleCancel = () => {
    onCancel();
  };

  const columns = [
    {
      title: t("back.couponList.firstName"),
      dataIndex: "firstName",
      key: "firstName",
      render: (text, record) =>
        record.error && !record.firstName ? (
          <span style={{ color: "red" }}>
            {t("back.couponList.noDataName")}
          </span>
        ) : (
          text
        ),
    },
    {
      title: t("back.couponList.lastName"),
      dataIndex: "lastName",
      key: "lastName",
      render: (text, record) =>
        record.error && !record.lastName ? (
          <span style={{ color: "red" }}>
            {t("back.couponList.noDataLastName")}
          </span>
        ) : (
          text
        ),
    },
    {
      title: t("back.couponList.customerId"),
      dataIndex: "customerId",
      key: "customerId",
      render: (text, record) => {
        if (record.error) {
          if (!record.customerId) {
            return (
              <span style={{ color: "red" }}>
                {t("back.couponList.noDataId")}
              </span>
            );
          }
          if (text === "Invalid ID Format") {
            return (
              <span style={{ color: "red" }}>
                {t("back.couponList.invalidIdFormat")}
              </span>
            );
          }
        }
        return text;
      },
    },
  ];

  return (
    <div>
      <Modal
        title={t("back.couponList.addCustomerList")}
        open={open}
        okButtonProps={{ disabled: disableUploadSave, loading: isUploading }}
        onOk={() => {
          form.submit();
        }}
        onCancel={handleCancel}
        okText={t("back.couponList.buttonSave")}
        cancelText={t("back.couponList.buttonCancel")}
      >
        <CommonForm form={form} onFinish={handleUpload} layout="vertical">
          <CommonForm.Item
            label={`${t("back.couponList.uploadCustomerList")} (.xlsx)`}
          >
            <Row align="middle" gutter={5}>
              <Col>
                <CommonForm.Item>
                  <Button
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadTemplate}
                  >
                    {t("back.couponList.downloadForm")}
                  </Button>
                </CommonForm.Item>
              </Col>
              <Col>
                <CommonForm.Item>
                  <Upload {...props} accept=".xlsx, .xls">
                    <Button icon={<UploadOutlined />} type="dashed">
                      {`${t("back.couponList.uploadFile")} ${fileName}`}
                    </Button>
                  </Upload>
                </CommonForm.Item>
              </Col>
            </Row>
            <>
              {excelData.length > 1 ? (
                <Tabs
                  activeKey={activeSheetKey}
                  onChange={(key) => setActiveSheetKey(key)}
                  items={excelData.map(({ sheetName, data }) => ({
                    label: sheetName,
                    key: sheetName,
                    children: (
                      <Table
                        dataSource={data}
                        columns={columns}
                        scroll={{ x: "max-content" }}
                        pagination={{ pageSize: 5, showSizeChanger: true }}
                        rowKey="key"
                      />
                    ),
                  }))}
                />
              ) : (
                <Table
                  dataSource={excelData[0]?.data || []}
                  columns={columns}
                  scroll={{ x: "max-content" }}
                  pagination={{
                    pageSize: limitPage,
                    current: page,
                    onChange: (page, pageSize) => {
                      setPage(page);
                      setLimitPage(pageSize);
                    },
                    pageSizeOptions: ["5", "10", "20", "50", "100"],
                    showSizeChanger: true,
                  }}
                  rowKey="key"
                />
              )}
            </>
          </CommonForm.Item>
        </CommonForm>
      </Modal>
    </div>
  );
};

export default CouponFormUpload;

