import { Button, Modal, Row, Col, Input, Upload, Switch, Spin } from "antd";
import CommonForm from "components/commonForm";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import SignatureCanvas from "react-signature-canvas";
import backOfficeServices from "services/backoffice.services";
import { AlertConfirm, AlertClosed, AlertSuccess, AlertError } from "components/alert";
import dayjs from "dayjs";
import fileService from "services/file.services";
import { dataURLtoFile } from "utils/fileUtils";
import { onUploadFile } from "hooks/onUploadFile";
import { errorToMessage } from "hooks/functions/errorToMessage";
import useUploadFileHook from "hooks/useUploadFileHook";
import { dummyRequest } from "hooks/dummyRequest";
import _ from "lodash";
import { UploadOutlined } from "@ant-design/icons";
import useMe from "hooks/useMe";
import { toStartOfDayISO } from "utils/format";

const ContractSignature = ({ data, open, onCancel, refetch }) => {
    const { t } = useTranslation();
    const [fileURL, setFileURL] = useState(null);
    const [genFile, setGenFile] = useState(false);
    const [customerSignature, setCustomerSignature] = useState(null);
    const [form] = CommonForm.useForm();
    const signatureRef = useRef();
    const [loading, setLoading] = useState(true);
    const [tempSignature, setTempSignature] = useState([]);
    const [fieldsChange, setFieldsChange] = useState({});
    const [tempContract, setTempContract] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        data: me
    } = useMe({ retry: 0 });
    const roleUser = me?.role?.roleType;

    const {
        fileList: signatureFileList,
        setFileList: setSignatureFileList,
        previewImage: signaturePreviewImage,
        previewOpen: signaturePreviewOpen,
        handlePreview: handleSignaturePreview,
        handleChange: handleSignatureChange,
        handleCancel: handleSignatureCancel,
    } = useUploadFileHook();

    const {
        fileList: contractFileList,
        setFileList: setContractFileList,
        handleChange: handleContractChange,
    } = useUploadFileHook();

    const { data: contractData, refetch: refetchContract } = backOfficeServices.useQueryGetContractById({
        id: data?.id,
    });

    useEffect(() => {
        if (contractData) {
            let _field = {
                ...contractData,
                method: !contractData?.isUploadContract,
                takeSignature: false
            };
            let signature_img = {
                uid: "-1",
                name: "signature_img.png",
                status: "done",
                url: contractData?.thumbCustomerSignaturePath,
            };
            let contractConfig = {
                uid: "-1",
                name: contractData?.contractPath,
                status: "done",
                url: contractData?.tempContractPath,
            };
            form.setFieldsValue(_field);
            setFieldsChange(_field)
            setCustomerSignature(contractData?.customerSignature)
            setTempSignature(contractData?.thumbCustomerSignaturePath ? [signature_img] : []);
            setFileURL(contractData?.tempContractPath);
            setTempContract(contractData?.isUploadContract ? [contractConfig] : []);
            setLoading(false);
        }
    }, [contractData]);

    useEffect(() => {
        setGenFile(false);
        if (open && data) {
            setLoading(true);
            refetchContract();
        } else if (form.__INTERNAL__.name) {
            form.resetFields();
        }
    }, [open, data]);

    const { mutateAsync: previewContractDocument } = fileService.useMutationPreviewContractDocument();

    const handlePreviewClick = async () => {
        const prefix = "contract";
        const values = await form.validateFields();

        let fileSignature = null;
        if (fieldsChange.takeSignature && signatureRef.current && !signatureRef.current.isEmpty()) {
            let signatureData = signatureRef.current ? signatureRef.current.toDataURL() : null;
            let signatureFile = signatureData ? dataURLtoFile(signatureData, `customerSignature.png`) : null;
            fileSignature = await onUploadFile({ prefix, fileList: [{ originFileObj: signatureFile }] });
        } else if (!fieldsChange.takeSignature && _.size(signatureFileList) > 0) {
            fileSignature = await onUploadFile({ prefix, fileList: signatureFileList });
        }
        const formattedValues = {
            ...contractData,
            ...values,
            contractDate: dayjs(values.contractDate).format("D MMMM YYYY"),
            address: `${values?.address} ${values?.district} ${values?.amphoe} ${values?.province} ${values?.zipcode}`,
            customerSignature: fileSignature,
            customerName: values?.customerName || null,
            customerPosition: values?.customerPosition || null,
        };

        setGenFile(true);
        setCustomerSignature(fileSignature);
        handlePreviewContractDocument(formattedValues);
    };

    const handlePreviewContractDocument = async (data) => {
        try {
            setLoading(true);

            const response = await previewContractDocument({ values: data });
            setFileURL(response.url)
        } catch (error) {
            console.error("Error previewing Contract Document", error);
        } finally {
            setLoading(false);
        }
    };

    const { mutateAsync: updateContractSignature } = backOfficeServices.useMutationUpdateContractSignature(
        (res) => {
            const { success, message } = res;
            if (success) {
                form.resetFields();
                refetch();
                setSignatureFileList([])
                setContractFileList([]);
                setFieldsChange({});
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

                if (!fileURL) return;

                try {
                    setIsSubmitting(true);
                    let uploadedFileName;
                    const isSystemMethod = fieldsChange?.method;

                    if (isSystemMethod) {
                        const fileName = `ContractDocument-${data.runNo}.pdf`;
                        const file = await fetchBlobFile(fileURL, fileName);
                        uploadedFileName = await onUploadFile({ prefix, fileList: [{ originFileObj: file }] });
                    } else {
                        uploadedFileName = _.size(contractFileList) > 0
                            ? await onUploadFile({ prefix, fileList: contractFileList })
                            : contractData?.contractPath;
                    }

                    const isData = {
                        ...data,
                        ...values,
                        contractDate: toStartOfDayISO(values?.contractDate),
                        contractPath: uploadedFileName,
                        prefixPath: uploadedFileName ? prefix : data?.prefixPath,
                        isUploadContract: !isSystemMethod,
                        ...(isSystemMethod && { customerSignature })
                    };

                    await updateContractSignature(isData);
                } catch (error) {
                    console.error("Error uploading file:", error);
                } finally {
                    setIsSubmitting(false);
                }
            }
        });
    };

    return (
        <Modal
            width={"90%"}
            className='md:!max-w-screen-lg !mx-auto !pt-3'
            title={t("back.contractSignature.titleContract")}
            open={open}
            okButtonProps={{
                disabled: !((!fieldsChange?.method && contractFileList?.length > 0) || (fieldsChange?.method && genFile)) || isSubmitting,
                loading: isSubmitting
            }}
            onOk={() => {
                form.submit();
            }}
            onCancel={() => {
                if (!data) {
                    form.resetFields();
                }
                setSignatureFileList([])
                setFieldsChange({});
                onCancel();
            }}
            okText={t("general.buttonSave")}
            cancelText={t("general.buttonCancel")}
        >
            <Spin spinning={loading}>
                <Row gutter={[16, 16]} >
                    <Col xs={24} md={roleUser === "organizer" ? 16 : 24}>
                        <iframe allowFullScreen
                            src={fileURL}
                            style={{ width: "100%", height: "600px" }}
                            title="PDF Viewer"
                        />
                    </Col>
                    {roleUser === "organizer" && (
                        <Col xs={24} md={8}>
                            <CommonForm
                                form={form}
                                name="contract-signature-form"
                                className="!mt-4"
                                layout="vertical"
                                onFinish={onFinish}
                                autoComplete="off">
                                <div className="my-4">
                                    <div>{t("back.contractSignature.method")}</div>
                                    <Switch
                                        size="large"
                                        checked={fieldsChange.method}
                                        checkedChildren={t("back.contractSignature.system")}
                                        unCheckedChildren={t("back.contractSignature.uploadFile")}
                                        onChange={(checked) => {
                                            setFieldsChange({
                                                ...fieldsChange,
                                                method: checked,
                                            });
                                        }}
                                    />
                                </div>
                                {fieldsChange.method ? (
                                    <>
                                        <CommonForm.Item
                                            name="customerName"
                                            label={t("back.contractSignature.customerName")}
                                        >
                                            <Input size="large" />
                                        </CommonForm.Item>
                                        <CommonForm.Item
                                            name="customerPosition"
                                            label={t("back.contractSignature.customerCompany")}
                                        >
                                            <Input size="large" />
                                        </CommonForm.Item>
                                        <div className="mt-4 mb-2">
                                            <div>{t("back.contractSignature.signature")}</div>
                                            <Switch
                                                size="large"
                                                checked={fieldsChange.takeSignature}
                                                checkedChildren={t("back.contractSignature.takeSignature")}
                                                unCheckedChildren={t("general.uploadSignature")}
                                                onChange={(checked) => {
                                                    setFieldsChange({
                                                        ...fieldsChange,
                                                        takeSignature: checked,
                                                    });
                                                }}
                                            />
                                        </div>
                                        <Row gutter={[16, 16]}>
                                            {!fieldsChange.takeSignature && (
                                                <Col xs={24} md={24}>
                                                    <Upload
                                                        customRequest={dummyRequest}
                                                        fileList={
                                                            _.size(signatureFileList) > 0
                                                                ? signatureFileList
                                                                : _.size(tempSignature) > 0
                                                                    ? tempSignature
                                                                    : []
                                                        }
                                                        accept="image/png, image/jpeg"
                                                        listType="picture-card"
                                                        maxCount={1}
                                                        onPreview={handleSignaturePreview}
                                                        onChange={handleSignatureChange}
                                                    >
                                                        <div>
                                                            <UploadOutlined size={20} className="!mb-2" />
                                                            <p>{t("general.uploadSignature")}</p>
                                                        </div>
                                                    </Upload>
                                                </Col>
                                            )}
                                            {fieldsChange.takeSignature && (
                                                <>
                                                    <Col xs={24} md={16}>
                                                        <SignatureCanvas
                                                            ref={signatureRef}
                                                            penColor="blue"
                                                            canvasProps={{
                                                                style: {
                                                                    width: '100%',
                                                                    height: 200,
                                                                    border: "1px solid #999999",
                                                                    borderRadius: "5px",
                                                                },
                                                            }}
                                                        />
                                                    </Col>
                                                    <Col xs={24} md={8}>
                                                        <Button
                                                            onClick={() => signatureRef.current && signatureRef.current.clear()}
                                                        >
                                                            {t("general.clear")}
                                                        </Button>
                                                    </Col>
                                                </>
                                            )}
                                        </Row>
                                        <Button
                                            className="!w-36 !mt-4"
                                            type="primary"
                                            onClick={handlePreviewClick}
                                            loading={loading}
                                        >
                                            {t("general.buttonPreView")}
                                        </Button>
                                    </>
                                ) : (
                                    <CommonForm.Item name="contractPath">
                                        <Upload
                                            customRequest={dummyRequest}
                                            fileList={
                                                _.size(contractFileList) > 0
                                                    ? contractFileList
                                                    : _.size(tempContract) > 0
                                                        ? tempContract
                                                        : []
                                            }
                                            accept=".jpg,.png,.pdf"
                                            maxCount={1}
                                            onChange={(info) => {
                                                handleContractChange(info);
                                                if (contractFileList.length > 0) {
                                                    const file = contractFileList[0].originFileObj;
                                                    const fileURL = URL.createObjectURL(file);
                                                    setFileURL(fileURL);
                                                } else {
                                                    setFileURL(contractData?.tempContractPath || "");
                                                }
                                            }}
                                        >
                                            <Button icon={<UploadOutlined />}>{t("back.contractSignature.uploadContract")}</Button>
                                        </Upload>
                                    </CommonForm.Item>
                                )}
                            </CommonForm>
                        </Col>
                    )}
                </Row>
            </Spin>
            <Modal open={signaturePreviewOpen} footer={null} onCancel={handleSignatureCancel}>
                <img
                    alt="signature-img"
                    style={{
                        width: "100%",
                    }}
                    src={signaturePreviewImage}
                />
            </Modal>
        </Modal >
    );
};

export default ContractSignature;


