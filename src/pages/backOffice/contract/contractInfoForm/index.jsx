import React, { useEffect, useState } from 'react';
import { Modal, Row, Col, Upload, Button, Popover, Spin } from 'antd';
import CommonForm from "components/commonForm";
import { useTranslation } from 'react-i18next';
import { AlertSuccess, AlertError, AlertConfirm, AlertClosed } from 'components/alert';
import dayjs from 'dayjs';
import ProvinceSelector from 'components/provinceSelector';
import backOfficeServices from 'services/backoffice.services';
import { errorToMessage } from 'hooks/functions/errorToMessage';
import { DeleteOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import _ from "lodash";
import useUploadFileHook from 'hooks/useUploadFileHook';
import { dummyRequest } from 'hooks/dummyRequest';
import { onUploadFile } from 'hooks/onUploadFile';
import { useMediaQuery } from 'react-responsive';
import FloatingLabel from 'components/floatingLabel';
import { validateIDCard } from 'utils/validate';
import PreviewModal from 'components/previewModal';
import SingleFileUploadField from 'components/singleFileUploadField';
import { toStartOfDay, toStartOfDayISO } from 'utils/format';

const ContractInfoForm = ({ isEditable, data, open, onCancel, refetch, mode }) => {
    const { t } = useTranslation();
    const [form] = CommonForm.useForm();
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
    const [eventOption, setEventOption] = useState([]);
    const [fieldsChange, setFieldsChange] = useState({});
    const [tempCertificate, setTempCertificate] = useState([]);
    const [tempIdCard, setTempIdCard] = useState([]);
    const [tempBankAccount, setTempBankAccount] = useState([]);
    const [tempPowerOfAttorney, setTempPowerOfAttorney] = useState([]);
    const [tempPp20, setTempPp20] = useState([]);
    const [tempOtherDocument, setTempOtherDocument] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        fileList: certificateFileList,
        setFileList: setCertificateFileList,
        previewImage: certificatePreviewImage,
        previewOpen: certificatePreviewOpen,
        handlePreview: handleCertificatePreview,
        handleChange: handleCertificateChange,
        handleCancel: handleCertificateCancel,
    } = useUploadFileHook();

    const {
        fileList: idCardFileList,
        setFileList: setIdCardFileList,
        previewImage: idCardPreviewImage,
        previewOpen: idCardPreviewOpen,
        handlePreview: handleIdCardPreview,
        handleChange: handleIdCardChange,
        handleCancel: handleIdCardCancel,
    } = useUploadFileHook();

    const {
        fileList: receiptFileList,
        setFileList: setReceiptFileList,
        previewImage: receiptPreviewImage,
        previewOpen: receiptPreviewOpen,
        handlePreview: handleReceiptPreview,
        handleChange: handleReceiptChange,
        handleCancel: handleReceiptCancel,
    } = useUploadFileHook();

    const {
        fileList: bankAccountFileList,
        setFileList: setBankAccountFileList,
        previewImage: bankAccountPreviewImage,
        previewOpen: bankAccountPreviewOpen,
        handlePreview: handleBankAccountPreview,
        handleChange: handleBankAccountChange,
        handleCancel: handleBankAccountCancel,
    } = useUploadFileHook();

    const {
        fileList: powerOfAttorneyFileList,
        setFileList: setPowerOfAttorneyFileList,
        previewImage: powerOfAttorneyPreviewImage,
        previewOpen: powerOfAttorneyPreviewOpen,
        handlePreview: handlePowerOfAttorneyPreview,
        handleChange: handlePowerOfAttorneyChange,
        handleCancel: handlePowerOfAttorneyCancel,
    } = useUploadFileHook();

    const {
        fileList: pp20FileList,
        setFileList: setPp20FileList,
        previewImage: pp20PreviewImage,
        previewOpen: pp20PreviewOpen,
        handlePreview: handlePp20Preview,
        handleChange: handlePp20Change,
        handleCancel: handlePp20Cancel,
    } = useUploadFileHook();

    const {
        fileList: otherDocumentFileList,
        setFileList: setOtherDocumentFileList,
        previewImage: otherDocumentPreviewImage,
        previewOpen: otherDocumentPreviewOpen,
        handlePreview: handleOtherDocumentPreview,
        handleChange: handleOtherDocumentChange,
        handleCancel: handleOtherDocumentCancel,
    } = useUploadFileHook();



    const guessFileType = (filename) => {
        const ext = filename?.split(".").pop()?.toLowerCase();
        switch (ext) {
            case "pdf": return "application/pdf";
            case "jpg":
            case "jpeg": return "image/jpeg";
            case "png": return "image/png";
            default: return "application/octet-stream";
        }
    };
    const { data: dataEvent } = backOfficeServices.useQueryGetAllActiveEvents({});

    useEffect(() => {
        if (dataEvent?.content?.length > 0) {
            const options = dataEvent?.content?.map(({ name, id, eventDate }) => ({
                value: id, label: name, eventDate
            })) || [];
            setEventOption(options);
        } else {
            setEventOption([]);
        }
    }, [dataEvent]);

    const { data: contractData, refetch: refetchContract, isFetching: isLoadingData } = backOfficeServices.useQueryGetContractById({
        id: data?.id,
    });

    useEffect(() => {
        if (contractData) {
            const selectedEvent = eventOption.find((event) => event.value === data.eventId);
            let _field = {
                ...contractData,
                startDate: toStartOfDay(contractData?.startDate),
                endDate: toStartOfDay(contractData?.endDate),
                eventDate: selectedEvent ? dayjs(selectedEvent?.eventDate) : null,
            };
            let certificateConfig = {
                uid: "-1",
                name: contractData?.certificatePath,
                status: "done",
                url: contractData?.tempCertificatePath,
                type: guessFileType(contractData?.certificatePath),
            };
            let idCardConfig = {
                uid: "-1",
                name: contractData?.idCardPath,
                status: "done",
                url: contractData?.tempIdCardPath,
                type: guessFileType(contractData?.idCardPath),
            };
            let bankAccountConfig = {
                uid: "-1",
                name: contractData?.bankAccountPath,
                status: "done",
                url: contractData?.tempBankAccountPath,
                type: guessFileType(contractData?.bankAccountPath),
            };
            let powerOfAttorneyConfig = {
                uid: "-1",
                name: contractData?.powerOfAttorneyPath,
                status: "done",
                url: contractData?.tempPowerOfAttorneyPath,
                type: guessFileType(contractData?.powerOfAttorneyPath),
            };
            let pp20Config = {
                uid: "-1",
                name: contractData?.pp20Path,
                status: "done",
                url: contractData?.tempPp20Path,
                type: guessFileType(contractData?.pp20Path),
            };
            let otherDocumentConfig = {
                uid: "-1",
                name: contractData?.otherDocumentPath,
                status: "done",
                url: contractData?.tempOtherDocumentPath,
                type: guessFileType(contractData?.otherDocumentPath),
            };
            const imgList = contractData?.mediaFiles?.map((media, index) => ({
                uid: `-${index + 1}`,
                name: media?.path,
                status: "done",
                url: media?.thumbUrl,
                type: guessFileType(media?.path),
            })) || [];

            setReceiptFileList(imgList);
            setTempCertificate(contractData?.tempCertificatePath ? [certificateConfig] : []);
            setTempIdCard(contractData?.tempIdCardPath ? [idCardConfig] : []);
            setTempBankAccount(contractData?.tempBankAccountPath ? [bankAccountConfig] : []);
            setTempPowerOfAttorney(contractData?.tempPowerOfAttorneyPath ? [powerOfAttorneyConfig] : []);
            setTempPp20(contractData?.tempPp20Path ? [pp20Config] : []);
            setTempOtherDocument(contractData?.tempOtherDocumentPath ? [otherDocumentConfig] : []);
            setFieldsChange(_field)
            form.setFieldsValue(_field);
        }
    }, [contractData]);

    useEffect(() => {
        if (open && data) {
            refetchContract()
        } else if (form.__INTERNAL__.name) {
                form.resetFields();
            }
    }, [open, data]);

    const handleEventChange = (value) => {
        const selectedEvent = eventOption.find((event) => event.value === value);
        if (selectedEvent) {
            form.setFieldsValue({
                eventDate: dayjs(selectedEvent.eventDate),
            });
        }
    };

    const { mutateAsync: createContract } = backOfficeServices.useMutationCreateContract(
        (res) => {
            const { success, message } = res;
            if (success) {
                form.resetFields();
                refetch();
                setCertificateFileList([]);
                setIdCardFileList([]);
                setReceiptFileList([]);
                setBankAccountFileList([]);
                setPowerOfAttorneyFileList([]);
                setPp20FileList([]);
                setOtherDocumentFileList([]);
                setTempCertificate([]);
                setTempIdCard([]);
                setTempBankAccount([]);
                setTempPowerOfAttorney([]);
                setTempPp20([]);
                setTempOtherDocument([]);
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

    const { mutateAsync: updateContract } = backOfficeServices.useMutationUpdateContract(
        (res) => {
            const { success, message } = res;
            if (success) {
                form.resetFields();
                refetch();
                setCertificateFileList([]);
                setIdCardFileList([]);
                setReceiptFileList([]);
                setBankAccountFileList([]);
                setPowerOfAttorneyFileList([]);
                setPp20FileList([]);
                setOtherDocumentFileList([]);
                setTempCertificate([]);
                setTempIdCard([]);
                setTempBankAccount([]);
                setTempPowerOfAttorney([]);
                setTempPp20([]);
                setTempOtherDocument([]);
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

    const onFinish = async (values) => {
        AlertConfirm({
            onOk: async () => {
                try {
                    setIsSubmitting(true);
                    const prefix = "contract";
                    let certificateFileName =
                        _.size(certificateFileList) > 0
                            ? await onUploadFile({ prefix, fileList: certificateFileList })
                            : fieldsChange?.certificatePath;
                    let idCardFileName =
                        _.size(idCardFileList) > 0
                            ? await onUploadFile({ prefix, fileList: idCardFileList })
                            : fieldsChange?.idCardPath;
                    let bankAccountFileName =
                        _.size(bankAccountFileList) > 0
                            ? await onUploadFile({ prefix, fileList: bankAccountFileList })
                            : fieldsChange?.bankAccountPath;
                    let powerOfAttorneyFileName =
                        _.size(powerOfAttorneyFileList) > 0
                            ? await onUploadFile({ prefix, fileList: powerOfAttorneyFileList })
                            : fieldsChange?.powerOfAttorneyPath;
                    let pp20FileName =
                        _.size(pp20FileList) > 0
                            ? await onUploadFile({ prefix, fileList: pp20FileList })
                            : fieldsChange?.pp20Path;
                    let otherDocumentFileName =
                        _.size(otherDocumentFileList) > 0
                            ? await onUploadFile({ prefix, fileList: otherDocumentFileList })
                            : fieldsChange?.otherDocumentPath;

                    let mediaFiles = [];
                    const oldMediaList = contractData?.mediaFiles || [];
                    for (const file of receiptFileList) {
                        if (file.uid.startsWith("-") || file.url) {
                            const oldMedia = oldMediaList.find(m => m.path === file.name);
                            if (oldMedia) {
                                mediaFiles.push({
                                    id: oldMedia.id,
                                    prefixPath: oldMedia.prefixPath,
                                    path: oldMedia.path,
                                });
                            }
                            continue;
                        }

                        const res = await onUploadFile({ prefix, fileList: [file] });
                        mediaFiles.push({ path: res });
                    }

                    let isData = {
                        ...contractData,
                        ...values,
                        startDate: toStartOfDayISO(values?.startDate),
                        endDate: toStartOfDayISO(values?.endDate),
                        prefixPath: prefix,
                        certificatePath: certificateFileName,
                        idCardPath: idCardFileName,
                        bankAccountPath: bankAccountFileName,
                        powerOfAttorneyPath: powerOfAttorneyFileName,
                        pp20Path: pp20FileName,
                        otherDocumentPath: otherDocumentFileName,
                        mediaFiles: mediaFiles,
                    };
                    await (data?.id ? updateContract(isData) : createContract(isData));
                } catch (err) {
                    AlertError({ text: errorToMessage(err) })
                } finally {
                    setIsSubmitting(false);
                }
            }
        });
    };

    const handleFileDelete = (type) => {
        if (type == "Certificate") {
            setCertificateFileList([]);
            setTempCertificate([]);
            setFieldsChange({ ...fieldsChange, certificatePath: null });
        } else if (type == "IdCard") {
            setIdCardFileList([]);
            setTempIdCard([]);
            setFieldsChange({ ...fieldsChange, idCardPath: null });
        } else if (type == "BankAccount") {
            setBankAccountFileList([]);
            setTempBankAccount([]);
            setFieldsChange({ ...fieldsChange, bankAccountPath: null });
        } else if (type == "PowerOfAttorney") {
            setPowerOfAttorneyFileList([]);
            setTempPowerOfAttorney([]);
            setFieldsChange({ ...fieldsChange, powerOfAttorneyPath: null });
        } else if (type == "Pp20") {
            setPp20FileList([]);
            setTempPp20([]);
            setFieldsChange({ ...fieldsChange, pp20Path: null });
        } else if (type == "OtherDocument") {
            setOtherDocumentFileList([]);
            setTempOtherDocument([]);
            setFieldsChange({ ...fieldsChange, otherDocumentPath: null });
        }
    };

    return (
        <Modal
            width={"90%"}
            className='md:!max-w-screen-lg !mx-auto !pt-3'
            title={
                mode === "new" ? t("back.contract.new") : mode === "edit" ? t("back.contract.edit") : t("back.contract.view")
            }
            open={open}
            okButtonProps={{
                disabled: !isEditable || isSubmitting,
                loading: isSubmitting
            }}
            onOk={() => {
                form.submit();
            }}
            onCancel={() => {
                if (!data) {
                    form.resetFields();
                }
                setCertificateFileList([]);
                setIdCardFileList([]);
                setReceiptFileList([]);
                setBankAccountFileList([]);
                setPowerOfAttorneyFileList([]);
                setPp20FileList([]);
                setOtherDocumentFileList([]);
                setTempCertificate([]);
                setTempIdCard([]);
                setTempBankAccount([]);
                setTempPowerOfAttorney([]);
                setTempPp20([]);
                setTempOtherDocument([]);
                setFieldsChange({});
                onCancel();
            }}
            okText={t("general.buttonSave")}
            cancelText={t("general.buttonCancel")}
        >
            <Spin spinning={isLoadingData}>
                <CommonForm
                    form={form}
                    name="contract-info-form"
                    className="!mt-4"
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <div className="grid gap-2">
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={16}>
                                <CommonForm.Item
                                    name="eventId"
                                    rules={[{ required: true, message: t("required.event") }]}
                                >
                                    <FloatingLabel
                                        type="select"
                                        showSearch
                                        disabled={!isEditable}
                                        label={t("back.contract.event")}
                                        placeholder={t("back.contract.selectEvent")}
                                        options={eventOption}
                                        onChange={handleEventChange}
                                        required
                                        filterOption={(input, option) =>
                                            option.label.toLowerCase().includes(input.toLowerCase())
                                        }
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="eventDate"
                                    getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
                                >
                                    <FloatingLabel
                                        type="date"
                                        label={t("back.contract.eventDate")}
                                        disabled
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="startDate"
                                    rules={[{ required: true, message: t("required.startDate") }]}
                                >
                                    <FloatingLabel
                                        type="date"
                                        label={t("back.contract.startDate")}
                                        disabled={!isEditable}
                                        required
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="endDate"
                                    rules={[
                                        { required: true, message: t("required.endDate") },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || value.isAfter(getFieldValue('startDate'))) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error(t("validation.endDateAfterStart")));
                                            },
                                        }),
                                    ]}
                                >
                                    <FloatingLabel
                                        type="date"
                                        label={t("back.contract.endDate")}
                                        disabled={!isEditable}
                                        required
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="runNo"
                                >
                                    <FloatingLabel
                                        label={t("back.contract.runNo")}
                                        disabled
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>

                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={16}>
                                <CommonForm.Item
                                    name="organizerName"
                                    rules={[{ required: true, message: t("required.organizer") }]}
                                >
                                    <FloatingLabel
                                        label={t("back.contract.organizerName")}
                                        required
                                        disabled={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="taxNo"
                                    rules={[{ required: true, message: t("required.taxNo") }]}
                                >
                                    <FloatingLabel
                                        label={t("back.contract.taxNo")}
                                        required
                                        disabled={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="idNo"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.idNo")
                                        },
                                        {
                                            validator: (_, value) => {
                                                if (!value) return Promise.resolve();

                                                const isCitizen = /^[0-9]{13}$/.test(value);
                                                const isPassport = /^[A-Z0-9]{5,20}$/i.test(value);

                                                if (isCitizen && !validateIDCard(value)) {
                                                    return Promise.reject(t("validation.idNo"));
                                                }

                                                if (!isCitizen && !isPassport) {
                                                    return Promise.reject(t("validation.idNoAndPassport"));
                                                }

                                                return Promise.resolve();
                                            },
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        label={t("back.contract.idNo")}
                                        required
                                        disabled={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="email"
                                    rules={[{ required: true, type: 'email', message: t("validation.email") }]}
                                >
                                    <FloatingLabel
                                        label={t("back.contract.email")}
                                        required
                                        disabled={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="tel"
                                    rules={[{
                                        required: true,
                                        message: t("required.phone"),
                                    },
                                    {
                                        pattern: /^[0-9]{7,15}$/,
                                        message: t("validation.number"),
                                    }]}
                                >
                                    <FloatingLabel
                                        label={t("back.contract.tel")}
                                        maxLength={15}
                                        required
                                        disabled={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="bankbook"
                                    rules={[{ required: true, message: t("required.bankbook") }]}
                                >
                                    <FloatingLabel
                                        label={t("back.contract.bankbook")}
                                        required
                                        disabled={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="accountNo"
                                    rules={[{
                                        required: true,
                                        message: t("required.accountNo")
                                    },
                                    {
                                        pattern: /^[0-9]+$/,
                                        message: t("validation.number"),
                                    },
                                    ]}
                                >
                                    <FloatingLabel
                                        label={t("back.contract.accountNo")}
                                        required
                                        disabled={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="accountName"
                                    rules={[{ required: true, message: t("required.accountName") }]}
                                >
                                    <FloatingLabel
                                        label={t("back.contract.accountName")}
                                        required
                                        disabled={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>
                        <CommonForm.Item
                            name="address"
                            rules={[{ required: true, message: t("required.address") }]}
                        >
                            <FloatingLabel
                                label={t("back.contract.address")}
                                required
                                disabled={!isEditable}
                            />
                        </CommonForm.Item>
                        <ProvinceSelector
                            form={form}
                            compact
                            rowGutter={[16, 16]}
                            disabled={!isEditable}
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
                        <CommonForm.Item
                            name="remark"
                        >
                            <FloatingLabel
                                type="textarea"
                                label={t("back.contract.remark")}
                                rows={3}
                                disabled={!isEditable}
                            />
                        </CommonForm.Item>
                        <div className="text-lg font-bold mb-3">{t("back.contract.titleDocument")} </div>
                        <CommonForm.Item name="certificatePath">
                            <SingleFileUploadField
                                fileList={certificateFileList}
                                tempFile={tempCertificate}
                                handlePreview={handleCertificatePreview}
                                handleChange={handleCertificateChange}
                                onDelete={() => handleFileDelete("Certificate")}
                                isMobile={isMobile}
                                disabled={!isEditable}
                                label={t("back.contract.certificate")}
                            />
                        </CommonForm.Item>
                        <CommonForm.Item name="idCardPath">
                            <SingleFileUploadField
                                fileList={idCardFileList}
                                tempFile={tempIdCard}
                                handlePreview={handleIdCardPreview}
                                handleChange={handleIdCardChange}
                                onDelete={() => handleFileDelete("IdCard")}
                                isMobile={isMobile}
                                disabled={!isEditable}
                                label={t("back.contract.idCard")}
                            />
                        </CommonForm.Item>
                        <CommonForm.Item name="bankAccountPath">
                            <SingleFileUploadField
                                fileList={bankAccountFileList}
                                tempFile={tempBankAccount}
                                handlePreview={handleBankAccountPreview}
                                handleChange={handleBankAccountChange}
                                onDelete={() => handleFileDelete("BankAccount")}
                                isMobile={isMobile}
                                disabled={!isEditable}
                                label={t("back.contract.bankAccount")}
                            />
                        </CommonForm.Item>
                        <CommonForm.Item name="powerOfAttorneyPath">
                            <SingleFileUploadField
                                fileList={powerOfAttorneyFileList}
                                tempFile={tempPowerOfAttorney}
                                handlePreview={handlePowerOfAttorneyPreview}
                                handleChange={handlePowerOfAttorneyChange}
                                onDelete={() => handleFileDelete("PowerOfAttorney")}
                                isMobile={isMobile}
                                disabled={!isEditable}
                                label={t("back.contract.powerOfAttorney")}
                            />
                        </CommonForm.Item>
                        <CommonForm.Item name="pp20Path">
                            <SingleFileUploadField
                                fileList={pp20FileList}
                                tempFile={tempPp20}
                                handlePreview={handlePp20Preview}
                                handleChange={handlePp20Change}
                                onDelete={() => handleFileDelete("Pp20")}
                                isMobile={isMobile}
                                disabled={!isEditable}
                                label="ภ.พ.20"
                            />
                        </CommonForm.Item>
                        <CommonForm.Item name="otherDocumentPath">
                            <SingleFileUploadField
                                fileList={otherDocumentFileList}
                                tempFile={tempOtherDocument}
                                handlePreview={handleOtherDocumentPreview}
                                handleChange={handleOtherDocumentChange}
                                onDelete={() => handleFileDelete("OtherDocument")}
                                isMobile={isMobile}
                                disabled={!isEditable}
                                label={t("back.contract.otherDocuments")}
                            />
                        </CommonForm.Item>
                        <CommonForm.Item name="receiptFiles">
                            <div className={isMobile ? "" : "w-full flex flex-col gap-2"}>
                                <Upload
                                    customRequest={dummyRequest}
                                    fileList={receiptFileList}
                                    accept=".jpg,.png,.pdf"
                                    maxCount={3}
                                    multiple
                                    showUploadList={isMobile}
                                    onPreview={handleReceiptPreview}
                                    onChange={handleReceiptChange}
                                >
                                    <Button icon={<UploadOutlined />} disabled={!isEditable || receiptFileList.length >= 3}>
                                        {t("back.contract.receipt")}
                                    </Button>
                                </Upload>

                                {/* Desktop แสดงชื่อไฟล์และปุ่มลบ */}
                                {!isMobile && receiptFileList.map((file, index) => (
                                    <span key={file.uid} className="w-full text-neutral-500 flex items-center gap-2 hover:bg-neutral-100">
                                        <PaperClipOutlined />
                                        <a
                                            onClick={() => handleReceiptPreview(file)}
                                            className="w-full text-neutral-600 cursor-pointer"
                                        >
                                            {t("back.contract.fileOrderPrefix", { count: index + 1 })} : {file.name}
                                        </a>
                                        <Popover content={t("general.buttonDeleteFile")}>
                                            <Button
                                                type="link"
                                                icon={<DeleteOutlined />}
                                                onClick={() => {
                                                    const newList = [...receiptFileList];
                                                    newList.splice(index, 1);
                                                    setReceiptFileList(newList);
                                                }}
                                                className="!text-neutral-500 !ml-auto"
                                                disabled={!isEditable}
                                            />
                                        </Popover>
                                    </span>
                                ))}
                            </div>
                        </CommonForm.Item>
                    </div>
                </CommonForm>
            </Spin>
            {certificatePreviewOpen && (
                <PreviewModal
                    open={certificatePreviewOpen}
                    onCancel={handleCertificateCancel}
                    previewImage={certificatePreviewImage}
                    fileList={certificateFileList}
                    tempFileList={tempCertificate}
                    title="certificate"
                />
            )}
            {idCardPreviewOpen && (
                <PreviewModal
                    open={idCardPreviewOpen}
                    onCancel={handleIdCardCancel}
                    previewImage={idCardPreviewImage}
                    fileList={idCardFileList}
                    tempFileList={tempIdCard}
                    title="idCard"
                />
            )}
            {bankAccountPreviewOpen && (
                <PreviewModal
                    open={bankAccountPreviewOpen}
                    onCancel={handleBankAccountCancel}
                    previewImage={bankAccountPreviewImage}
                    fileList={bankAccountFileList}
                    tempFileList={tempBankAccount}
                    title="bankAccount"
                />
            )}
            {powerOfAttorneyPreviewOpen && (
                <PreviewModal
                    open={powerOfAttorneyPreviewOpen}
                    onCancel={handlePowerOfAttorneyCancel}
                    previewImage={powerOfAttorneyPreviewImage}
                    fileList={powerOfAttorneyFileList}
                    tempFileList={tempPowerOfAttorney}
                    title="powerOfAttorney"
                />
            )}
            {pp20PreviewOpen && (
                <PreviewModal
                    open={pp20PreviewOpen}
                    onCancel={handlePp20Cancel}
                    previewImage={pp20PreviewImage}
                    fileList={pp20FileList}
                    tempFileList={tempPp20}
                    title="pp20"
                />
            )}
            {otherDocumentPreviewOpen && (
                <PreviewModal
                    open={otherDocumentPreviewOpen}
                    onCancel={handleOtherDocumentCancel}
                    previewImage={otherDocumentPreviewImage}
                    fileList={otherDocumentFileList}
                    tempFileList={tempOtherDocument}
                    title="otherDocument"
                />
            )}
            {receiptPreviewOpen && (
                <PreviewModal
                    open={receiptPreviewOpen}
                    onCancel={handleReceiptCancel}
                    previewImage={receiptPreviewImage}
                    fileList={receiptFileList}
                    tempFileList={receiptFileList}
                    title="receipt"
                />
            )}
        </Modal>
    );
};

export default ContractInfoForm;


