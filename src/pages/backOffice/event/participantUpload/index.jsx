import { UploadOutlined } from '@ant-design/icons';
import { Button, Divider, Empty, Modal, Table, Tabs, Tooltip, Upload } from 'antd';
import { AlertError } from 'components/alert';
import { bloodGroupOption } from 'constants/options/bloodGroupOption';
import { genderOption } from 'constants/options/genderOption';
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next';
import ExcelJS from 'exceljs';
import { toStartOfDayISO } from "utils/format";

const ParticipantUpload = ({ open = false, onOk, onCancel, nationalityValues }) => {
    const { t } = useTranslation();
    const [fileName, setFileName] = useState("");
    const [excelData, setExcelData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeSheetKey, setActiveSheetKey] = useState(null);
    const [page, setPage] = useState(1);
    const [limitPage, setLimitPage] = useState(5);
    const bloodGroupValues = bloodGroupOption.map((bg) => bg.value);
    const genderValues = genderOption.map((g) => g.value);

    const props = {
        beforeUpload: async (file) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = e.target.result;
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(data);

                const allData = [];

                workbook.eachSheet((worksheet, sheetId) => {
                    const rows = [];
                    worksheet.eachRow((row) => {
                        rows.push(row.values.slice(1));
                    });

                    const format = rows.map(row =>
                        row.map(cell => cell instanceof Date ? toStartOfDayISO(cell) : cell)
                    );

                    if (format[0][0] !== "ชื่ออีเว้นท์" || !format[0][1]) {
                        AlertError({ text: t("back.event.participant.upload.alertError") });
                        setFileName("");
                        return;
                    } else {
                        setFileName(file.name);
                    }

                    const unitName = format[0][1];
                    format.shift();

                    const headers = format[0];
                    format.shift();

                    const formattedData = format.map((row) => {
                        const obj = {};
                        headers.forEach((header, index) => {
                            obj[header] = row[index];
                        });

                        obj.validation = "";

                        if (!obj["id"] || !String(obj["id"]).trim()) {
                            obj.validation += `${t("back.event.participant.upload.missingId")}, `;
                        }

                        if (obj["เพศ"]?.trim()) {
                            const normalizedGender = genderValues.find(
                                (gender) => gender.toLowerCase() === obj["เพศ"]?.trim().toLowerCase()
                            );
                            if (normalizedGender) {
                                obj["เพศ"] = normalizedGender;
                            } else {
                                obj.validation += `${t("back.event.participant.upload.invalidGender")}, `;
                            }
                        }

                        if (obj["สัญชาติ"]?.trim()) {
                            const normalizedNationality = obj["สัญชาติ"]?.trim().toUpperCase();
                            if (!nationalityValues.includes(normalizedNationality)) {
                                obj.validation += `${t("back.event.participant.upload.invalidNationality")}, `;
                            } else {
                                obj["สัญชาติ"] = normalizedNationality;
                            }
                        }

                        if (obj["หมู่เลือด"]?.trim()) {
                            const normalizedBloodGroup = obj["หมู่เลือด"]?.trim().toUpperCase();
                            if (!bloodGroupValues.includes(normalizedBloodGroup)) {
                                obj.validation += `${t("back.event.participant.upload.invalidBloodGroup")}, `;
                            } else {
                                obj["หมู่เลือด"] = normalizedBloodGroup;
                            }
                        }

                        obj.validation = obj.validation?.trim().replace(/,$/, "");

                        return obj;
                    });

                    allData.push({ sheetName: unitName, data: formattedData });
                    if (sheetId === 1) setActiveSheetKey(unitName);
                });

                setExcelData(allData);
                setUploading(false);
            };
            reader.readAsArrayBuffer(file);
            setUploading(true);
            return false;
        },
        showUploadList: false,
        onChange: (info) => {
            if (info.fileList.length > 0) {
                setFileName(info.fileList[0].name);
            }
        }
    };

    const handleDownloadWithValidation = async () => {
        const workbook = new ExcelJS.Workbook();

        for (const sheet of excelData) {
            const worksheet = workbook.addWorksheet(sheet.sheetName);

            const dataWithValidation = sheet.data.map(row => ({
                ...row,
                validation: row.validation || ""
            }));

            const headers = Object.keys(dataWithValidation[0] || {});

            worksheet.addRow(["ชื่ออีเว้นท์", sheet.sheetName]);
            worksheet.addRow(headers);

            dataWithValidation.forEach(row => {
                const rowData = headers.map(header => row[header]);
                worksheet.addRow(rowData);
            });
        }

        const newFileName = fileName.replace(/(\.[^/.]+)$/, "_With_Validation$1");

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = globalThis.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", newFileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCancel = () => {
        onCancel();
    };

    const handleOk = async () => {
        const invalidRows = excelData?.flatMap(sheet =>
            sheet.data.filter(row => row.validation && row.validation !== t("back.event.participant.upload.valid"))
        );

        if (invalidRows?.length > 0) {
            AlertError({ text: t("back.event.participant.upload.validationError") });
            return;
        }
        try {
            setSaving(true);
            await onOk(excelData);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (!open) {
            setExcelData(null);
            setFileName("");
            setUploading(false);
            setActiveSheetKey(null);
            setPage(1);
            setLimitPage(5);
        }
    }, [open]);

    const columns = excelData
        ?
        Object.keys(excelData[0]?.data[0] || {}).map((header) => ({
            title: header === "validation" ? t("back.event.participant.upload.validation") : header,
            dataIndex: header,
            ...(header === "validation" && {
                render: (text) => (
                    <span style={{ color: text === t("back.event.participant.upload.valid") ? "green" : "red" }}>
                        {text}
                    </span>
                ),
            }),
        }))
        : [];
    return (
        <Modal
            title={t("back.event.participant.upload.title")}
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            okText={t("general.buttonSave")}
            cancelText={t("general.buttonCancel")}
            width={1000}
            confirmLoading={uploading || saving}
            okButtonProps={{ disabled: uploading || saving }}
        >
            <div className="my-4">
                <p className="fs-6 mb-2">{t("back.event.participant.upload.upload")} (.xlsx)</p>
                <div className={`d-flex gap-2`}>
                    <Upload accept=".xls , .xlsx , .csv , .numbers" {...props}>
                        <Tooltip title={fileName}>
                            <Button
                                size="large"
                                type="dashed"
                                icon={<UploadOutlined />}
                                disabled={uploading}
                                className="d-flex gap-2 align-items-center"
                            >
                                <span className="max-w-[200px] md:max-w-[900px] text-truncate">
                                    {uploading ? "Uploading..." : ` + ${t("back.event.participant.upload.uploadFile")}: ${fileName}`}
                                </span>
                            </Button>
                        </Tooltip>
                    </Upload>
                </div>

                {excelData && (
                    <>
                        <div className="mt-2">
                            <Tabs
                                activeKey={activeSheetKey}
                                onChange={(key) => setActiveSheetKey(key)}
                                type="card"
                                items={excelData.map(({ sheetName, data }) => ({
                                    label: sheetName,
                                    key: sheetName,
                                    children: (
                                        <Table
                                            className="!w-full !text-nowrap"
                                            bordered
                                            dataSource={data}
                                            columns={columns}
                                            scroll={{ x: true }}
                                            locale={{ emptyText: <Empty description={t("back.event.participant.upload.noData")} /> }}
                                            pagination={{
                                                pageSize: limitPage,
                                                current: page,
                                                onChange: (page, pageSize) => {
                                                    setPage(page);
                                                    setLimitPage(pageSize);
                                                },
                                                total: data.length,
                                                pageSizeOptions: ['5', '10', '20', '50', '100'],
                                                showSizeChanger: true,
                                            }}
                                        />
                                    ),
                                }))}
                            />
                        </div>
                        <Button
                            size="large"
                            onClick={handleDownloadWithValidation}
                            disabled={!excelData?.length}
                        >
                            {t("back.event.participant.upload.downloadWithValidation")}
                        </Button>
                    </>
                )}
            </div>
            <Divider />
        </Modal>
    )
}

export default ParticipantUpload
