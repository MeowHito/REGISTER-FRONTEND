import React, { useEffect, useState } from "react";
import { Modal, Button, Row, Col, Spin } from "antd";
import CommonForm from "components/commonForm";
import { useTranslation } from "react-i18next";
import ProvinceSelector from "components/provinceSelector";
import backOfficeServices from "services/backoffice.services";
import dayjs from "dayjs";
import fileService from "services/file.services";
import { AlertConfirm, AlertClosed, AlertError, AlertSuccess } from "components/alert";
import { errorToMessage } from "hooks/functions/errorToMessage";
import { onUploadFile } from "hooks/onUploadFile";
import FloatingLabel from "components/floatingLabel";
import { toStartOfDay, toStartOfDayISO } from "utils/format";

const ContractForm = ({ data, open, onCancel, refetch }) => {
    const { t } = useTranslation();
    const [form] = CommonForm.useForm();
    const [loading, setLoading] = useState(false);
    const [fileURL, setFileURL] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);


    const { data: contractData, refetch: refetchContract, isFetching: isLoadingData } = backOfficeServices.useQueryGetContractById({
        id: data?.id,
    });

    useEffect(() => {
        if (contractData) {
            let _field = {
                ...contractData,
                contractDate: toStartOfDay(contractData?.contractDate),
                customerCompany: contractData?.organizerName,
                organizer: contractData?.organizerName,
                event: contractData?.eventName,
            };
            form.setFieldsValue(_field);
        }
    }, [contractData]);

    useEffect(() => {
        setFileURL(null);
        if (open && data) {
            refetchContract();
        } else {
            if (form.__INTERNAL__.name) {
                form.resetFields();
            }
        }
    }, [open, data]);

    const { mutateAsync: previewContractDocument } = fileService.useMutationPreviewContractDocument();

    const handlePreviewClick = () => {
        form.validateFields()
            .then((values) => {
                const formattedValues = {
                    ...values,
                    contractDate: dayjs(values.contractDate).format("D MMMM YYYY"),
                    address: `${values?.address} ${values?.district} ${values?.amphoe} ${values?.province} ${values?.zipcode}`
                };
                handlePreviewContractDocument(formattedValues);
            });
    };

    const handlePreviewContractDocument = async (data) => {
        try {
            setLoading(true);

            const response = await previewContractDocument({ values: data });
            setFileURL(response.url)
            globalThis.open(response.url, "_blank");
        } catch (error) {
            console.error("Error previewing Contract Document", error);
        } finally {
            setLoading(false);
        }
    };

    const { mutateAsync: updateContractDocument } = backOfficeServices.useMutationUpdateContractDocument(
        (res) => {
            const { success, message } = res;
            if (success) {
                form.resetFields();
                refetch();
                AlertClosed();
                onCancel();
                AlertSuccess({});
            } else {
                AlertError({ text: message });
            }
        },
        (err) => {
            AlertClosed();
            onCancel();
            AlertError({ text: errorToMessage(err?.response?.data?.message || err) });
        }
    );

    const fetchBlobFile = async (blobUrl, fileName) => {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        return new File([blob], fileName, { type: blob.type });
    };

    const onFinish = async (values) => {
        AlertConfirm({
            onOk: async () => {
                const prefix = "contract";
                if (fileURL) {
                    try {
                        setIsSubmitting(true);
                        const fileName = `ContractDocument-${data.runNo}.pdf`;
                        const file = await fetchBlobFile(fileURL, fileName);
                        const uploadedFileName = await onUploadFile({ prefix, fileList: [{ originFileObj: file }] });

                        const isData = {
                            ...data,
                            ...values,
                            contractDate: toStartOfDayISO(values?.contractDate),
                            contractPath: uploadedFileName,
                            prefixPath: uploadedFileName ? prefix : data?.prefixPath,
                        };
                        await updateContractDocument(isData);
                    } catch (error) {
                        console.error("Error uploading file:", error);
                    } finally {
                        setIsSubmitting(false);
                    }
                }
            }
        });
    };

    return (
        <div>
            <Modal
                width={"90%"}
                className='md:!max-w-screen-lg !mx-auto !pt-3'
                title={t("back.contractForm.titleContractForm")}
                open={open}
                okButtonProps={{
                    disabled: !fileURL || isSubmitting,
                    loading: isSubmitting
                }}
                onOk={() => {
                    form.submit();
                }}
                onCancel={() => {
                    setFileURL(null);
                    setIsSubmitting(false);
                    if (!data) {
                        form.resetFields();
                    }
                    onCancel();
                }}
                okText={t("general.buttonSave")}
                cancelText={t("general.buttonCancel")}
            >
                <Spin spinning={isLoadingData}>
                    <CommonForm
                        form={form}
                        name="contract-form"
                        className="!mt-4"
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off">
                        <div className="grid gap-2">
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="runNo"
                                    >
                                        <FloatingLabel
                                            label={t("back.contractForm.runNo")}
                                            disabled
                                        />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="contractDate"
                                        getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
                                    >
                                        <FloatingLabel
                                            type="date"
                                            label={t("back.contractForm.contractDate")}
                                            placeholder={t("general.date")}
                                            className="w-full"
                                            disabled
                                        />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="event"
                                    >
                                        <FloatingLabel
                                            label={t("back.contractForm.event")}
                                            disabled
                                        />
                                    </CommonForm.Item>
                                </Col>
                            </Row>
                            <CommonForm.Item
                                name="detail"
                            >
                                <FloatingLabel
                                    type="textarea"
                                    label={t("back.contractForm.detail")}
                                    rows={10}
                                />
                            </CommonForm.Item>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="customerCompany"
                                    >
                                        <FloatingLabel
                                            label={t("back.contractForm.customerCompany")}
                                        />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="organizer"
                                    >
                                        <FloatingLabel
                                            label={t("back.contractForm.organizer")}
                                        />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="taxNo"
                                        rules={[
                                            {
                                                pattern: /^[0-9]+$/,
                                                message: t("validation.number"),
                                            },
                                        ]}
                                    >
                                        <FloatingLabel
                                            label={t("back.contractForm.taxNo")}
                                        />
                                    </CommonForm.Item>
                                </Col>
                            </Row>
                            <CommonForm.Item
                                name="address"
                            >
                                <FloatingLabel
                                    label={t("back.contractForm.address")}
                                />
                            </CommonForm.Item>
                            <ProvinceSelector
                                form={form}
                                compact
                                rowGutter={[16, 16]}
                                valueMode={{
                                    province: "nameTh",
                                    amphoe: "nameTh",
                                    district: "nameTh",
                                }}
                                labels={{
                                    zipcode: t("back.contract.zipcode"),
                                    province: t("back.contract.province"),
                                    amphoe: t("back.contract.amphoe"),
                                    district: t("back.contract.district"),
                                }}
                            />
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="tel"
                                        rules={[{
                                            pattern: /^[0-9]{7,15}$/,
                                            message: t("validation.number"),
                                        },
                                        ]}
                                    >
                                        <FloatingLabel
                                            label={t("back.contractForm.tel")}
                                            maxLength={15}
                                        />
                                    </CommonForm.Item>
                                </Col>
                            </Row>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="providerName"
                                    >
                                        <FloatingLabel
                                            label={t("back.contractForm.providerName")}
                                        />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={16}>
                                    <CommonForm.Item
                                        name="providerPosition"
                                    >
                                        <FloatingLabel
                                            label={t("back.contractForm.position")}
                                        />
                                    </CommonForm.Item>
                                </Col>
                            </Row>
                            <Button
                                className="w-36"
                                type="primary"
                                onClick={handlePreviewClick}
                                loading={loading}
                                disabled={loading || isSubmitting}
                            >
                                {t("general.buttonPreView")}
                            </Button>
                        </div>
                    </CommonForm>
                </Spin>
            </Modal>
        </div>
    );
};

export default ContractForm;


