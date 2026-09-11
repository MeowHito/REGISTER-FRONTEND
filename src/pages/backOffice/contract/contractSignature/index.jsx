import { Alert, Button, Card, Modal, Row, Col, Input, Upload, Switch, Spin, Space, Tabs, Tag, Tooltip } from "antd";
import CommonForm from "components/commonForm";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMediaQuery } from "react-responsive";
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
import { ArrowLeftOutlined, DeleteOutlined, ExportOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons";
import useMe from "hooks/useMe";

const draftKeyFor = (contractId) => contractId ? `contract-signature-draft-${contractId}` : null;

const SIGNATURE_CANVAS_HEIGHT = 180;

const ContractSignature = ({ data, open, onCancel, refetch }) => {
    const { t } = useTranslation();
    const [form] = CommonForm.useForm();
    const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
    const signatureRef = useRef();
    const signatureWrapperRef = useRef(null);
    const draftSavedRef = useRef(false);
    const [canvasWidth, setCanvasWidth] = useState(0);
    const [activeTab, setActiveTab] = useState("pdf");

    const [fileURL, setFileURL] = useState(null);
    const [customerSignature, setCustomerSignature] = useState(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewFresh, setPreviewFresh] = useState(false);

    const [hasDrawnStroke, setHasDrawnStroke] = useState(false);
    const [isReplacingSignature, setIsReplacingSignature] = useState(false);

    const [tempSignature, setTempSignature] = useState([]);
    const [tempContract, setTempContract] = useState([]);
    const [fieldsChange, setFieldsChange] = useState({ method: true, takeSignature: true });

    const { data: me } = useMe({ retry: 0 });
    const roleUser = me?.role?.roleType;
    const isAdmin = roleUser === "admin";

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

    const {
        data: contractData,
        refetch: refetchContract,
        isFetching: isFetchingContract,
    } = backOfficeServices.useQueryGetContractById({
        id: data?.id,
    });

    const loadDraftIntoField = (field, contract) => {
        const draftKey = draftKeyFor(contract?.id);
        if (!draftKey) return field;
        try {
            const raw = localStorage.getItem(draftKey);
            if (!raw) return field;
            const draft = JSON.parse(raw);
            return {
                ...field,
                ...(draft?.customerName && { customerName: draft.customerName }),
                ...(draft?.customerPosition && { customerPosition: draft.customerPosition }),
            };
        } catch {
            return field;
        }
    };

    const buildSignatureFile = (contract) => (
        contract?.thumbCustomerSignaturePath
            ? [{
                uid: "-1",
                name: "signature_img.png",
                status: "done",
                url: contract.thumbCustomerSignaturePath,
            }]
            : []
    );

    const buildContractFile = (contract) => (
        contract?.isUploadContract
            ? [{
                uid: "-1",
                name: contract?.contractPath,
                status: "done",
                url: contract?.tempContractPath,
            }]
            : []
    );

    useEffect(() => {
        if (!open || !contractData) return;

        const initial = {
            ...contractData,
            method: !contractData?.isUploadContract,
            takeSignature: true,
        };
        const field = loadDraftIntoField(initial, contractData);

        form.setFieldsValue(field);
        setFieldsChange(field);
        setCustomerSignature(contractData?.customerSignature);
        setTempSignature(buildSignatureFile(contractData));
        setFileURL(contractData?.tempContractPath);
        setTempContract(buildContractFile(contractData));
        setIsReplacingSignature(!contractData?.customerSignature);
        setPreviewFresh(false);
        setHasDrawnStroke(false);
    }, [contractData, open]);

    useEffect(() => {
        setPreviewFresh(false);
        setHasDrawnStroke(false);
        setActiveTab("pdf");
        if (open && data) {
            refetchContract();
        } else if (form.__INTERNAL__.name) {
            form.resetFields();
            setSignatureFileList([]);
            setContractFileList([]);
            setTempSignature([]);
            setTempContract([]);
            setCustomerSignature(null);
            setFileURL(null);
        }
    }, [open, data]);

    const persistDraft = useCallback(() => {
        const draftKey = draftKeyFor(contractData?.id);
        if (!draftKey) return;
        const v = form.getFieldsValue();
        if (v?.customerName || v?.customerPosition) {
            localStorage.setItem(draftKey, JSON.stringify({
                customerName: v.customerName,
                customerPosition: v.customerPosition,
            }));
            draftSavedRef.current = true;
        }
    }, [contractData?.id, form]);

    const clearDraft = useCallback(() => {
        const draftKey = draftKeyFor(contractData?.id);
        if (draftKey) localStorage.removeItem(draftKey);
        draftSavedRef.current = false;
    }, [contractData?.id]);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (draftSavedRef.current && !isSubmitting) {
                e.preventDefault();
                e.returnValue = t("back.contractSignature.unsavedChangesWarning");
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [open, isSubmitting, t]);

    const { mutateAsync: previewContractDocument } = fileService.useMutationPreviewContractDocument();

    const { mutateAsync: updateContractSignature } = backOfficeServices.useMutationUpdateContractSignature(
        (res) => {
            const { success, message } = res;
            if (success) {
                clearDraft();
                form.resetFields();
                refetch();
                setSignatureFileList([]);
                setContractFileList([]);
                setFieldsChange({ method: true, takeSignature: true });
                AlertClosed();
                onCancel();
                AlertSuccess({});
            } else {
                AlertError({ text: message });
            }
        },
        (err) => {
            AlertError({ text: errorToMessage(err?.response?.data?.message || err) });
        }
    );

    const composedAddress = useMemo(() => (
        [
            contractData?.address,
            contractData?.district,
            contractData?.amphoe,
            contractData?.province,
            contractData?.zipcode,
        ].filter(Boolean).join(" ").replaceAll(/\s+/g, " ").trim()
    ), [contractData]);

    const hasExistingSignature = !!customerSignature;
    const isAlreadySigned = !!contractData?.customerSignature || !!contractData?.isUploadContract;
    const isSystemMethod = !!fieldsChange?.method;
    const useDrawMode = !!fieldsChange?.takeSignature;

    const signatureReady = useMemo(() => {
        if (!isSystemMethod) return true;
        if (hasExistingSignature && !isReplacingSignature) return true;
        if (useDrawMode) return hasDrawnStroke;
        return _.size(signatureFileList) > 0;
    }, [isSystemMethod, hasExistingSignature, isReplacingSignature, useDrawMode, hasDrawnStroke, signatureFileList]);

    const uploadModeReady = (!isSystemMethod || isAdmin) && _.size(contractFileList) > 0;
    const saveDisabled = isAdmin
        ? (!uploadModeReady || isSubmitting)
        : isSystemMethod
            ? (!previewFresh || isSubmitting || isPreviewing)
            : (!uploadModeReady || isSubmitting);

    const fetchBlobFile = async (blobUrl, fileName) => {
        const response = await fetch(blobUrl);
        const blob = await response.blob();
        return new File([blob], fileName, { type: blob.type });
    };

    const uploadSignatureIfNeeded = async () => {
        const prefix = "contract";
        if (useDrawMode && hasDrawnStroke && signatureRef.current && !signatureRef.current.isEmpty()) {
            const signatureData = signatureRef.current.toDataURL();
            const signatureFile = dataURLtoFile(signatureData, `customerSignature.png`);
            return onUploadFile({ prefix, fileList: [{ originFileObj: signatureFile }] });
        }
        if (!useDrawMode && _.size(signatureFileList) > 0) {
            return onUploadFile({ prefix, fileList: signatureFileList });
        }
        return customerSignature;
    };

    const handlePreviewClick = async () => {
        try {
            const values = await form.validateFields();

            if (!signatureReady) {
                AlertError({ text: t("back.contractSignature.requireSignature") });
                return;
            }

            setIsPreviewing(true);
            const fileSignature = await uploadSignatureIfNeeded();
            if (!fileSignature) {
                throw new Error(t("back.contractSignature.requireSignature"));
            }

            const payload = {
                ...contractData,
                ...values,
                contractDate: contractData?.contractDate
                    ? dayjs(contractData.contractDate).format("D MMMM YYYY")
                    : "",
                address: composedAddress,
                customerSignature: fileSignature,
                customerName: values?.customerName || null,
                customerPosition: values?.customerPosition || null,
            };

            const response = await previewContractDocument({ values: payload });
            if (response?.url) {
                setFileURL(response.url);
                setCustomerSignature(fileSignature);
                setPreviewFresh(true);
                if (isMobile) setActiveTab("pdf");
            }
        } catch (error) {
            if (error?.errorFields) return;
            AlertError({ text: errorToMessage(error?.response?.data?.message || error) });
        } finally {
            setIsPreviewing(false);
        }
    };

    const onFinish = async (values) => {
        AlertConfirm({
            text: t("back.contractSignature.finalVersionWarning"),
            onOk: async () => {
                const prefix = "contract";
                try {
                    setIsSubmitting(true);

                    let uploadedFileName;
                    if (isSystemMethod && !isAdmin) {
                        if (!fileURL) {
                            throw new Error(t("back.contractSignature.noPdfAvailable"));
                        }
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
                        contractPath: uploadedFileName,
                        prefixPath: uploadedFileName ? prefix : data?.prefixPath,
                        isUploadContract: isAdmin ? true : !isSystemMethod,
                        ...(isSystemMethod && !isAdmin && { customerSignature }),
                    };
                    await updateContractSignature(isData);
                } catch (error) {
                    AlertError({ text: errorToMessage(error?.response?.data?.message || error) });
                } finally {
                    setIsSubmitting(false);
                }
            },
        });
    };

    const handleClearSignature = () => {
        signatureRef.current?.clear();
        setHasDrawnStroke(false);
        setPreviewFresh(false);
    };

    const handleSignatureBegin = () => {
        setPreviewFresh(false);
    };

    const handleSignatureEnd = () => {
        if (signatureRef.current) {
            setHasDrawnStroke(!signatureRef.current.isEmpty());
        }
    };

    const handleReplaceSignature = () => {
        setIsReplacingSignature(true);
        setPreviewFresh(false);
    };

    const handleKeepSignature = () => {
        setIsReplacingSignature(false);
    };

    const handleMethodChange = (checked) => {
        setFieldsChange((prev) => ({ ...prev, method: checked }));
        setPreviewFresh(false);
    };

    const handleDrawModeChange = (checked) => {
        setFieldsChange((prev) => ({ ...prev, takeSignature: checked }));
        setPreviewFresh(false);
        setHasDrawnStroke(false);
        signatureRef.current?.clear();
    };

    useEffect(() => {
        if (isReplacingSignature) {
            signatureRef.current?.clear();
            setHasDrawnStroke(false);
        }
    }, [isReplacingSignature]);

    useEffect(() => {
        if (!open || !signatureWrapperRef.current) return undefined;
        const el = signatureWrapperRef.current;
        const sync = () => {
            const w = el.clientWidth;
            if (w > 0) setCanvasWidth(w);
        };
        sync();
        const ro = new ResizeObserver(sync);
        ro.observe(el);
        return () => ro.disconnect();
    }, [open, useDrawMode, isReplacingSignature]);

    const onFieldsChange = () => {
        setPreviewFresh(false);
        persistDraft();
    };

    const handleModalCancel = () => {
        if (draftSavedRef.current && !isSubmitting) {
            AlertConfirm({
                text: t("back.contractSignature.unsavedChangesWarning"),
                onOk: () => {
                    setSignatureFileList([]);
                    setFieldsChange({ method: true, takeSignature: true });
                    onCancel();
                },
            });
            return;
        }
        setSignatureFileList([]);
        setFieldsChange({ method: true, takeSignature: true });
        onCancel();
    };

    const handleOpenInNewTab = () => {
        if (fileURL) globalThis.open(fileURL, "_blank");
    };

    const renderSummary = () => (
        <Card size="small" className="!mb-3 !bg-neutral-50">
            <Row gutter={[12, 4]}>
                <Col xs={12} md={6}>
                    <div className="text-xs text-neutral-500">{t("back.contractSignature.summaryRunNo")}</div>
                    <div className="font-medium">{contractData?.runNo || "-"}</div>
                </Col>
                <Col xs={12} md={6}>
                    <div className="text-xs text-neutral-500">{t("back.contractSignature.summaryContractDate")}</div>
                    <div className="font-medium">
                        {contractData?.contractDate ? dayjs(contractData.contractDate).format("D MMM YYYY") : "-"}
                    </div>
                </Col>
                <Col xs={24} md={12}>
                    <div className="text-xs text-neutral-500">{t("back.contractSignature.summaryEvent")}</div>
                    <div className="font-medium truncate">{contractData?.eventName || "-"}</div>
                </Col>
                <Col xs={24} md={24}>
                    <div className="text-xs text-neutral-500">{t("back.contractSignature.summaryOrganizer")}</div>
                    <div className="font-medium truncate">{contractData?.organizerName || "-"}</div>
                </Col>
            </Row>
        </Card>
    );

    const renderSignaturePanel = () => {
        if (hasExistingSignature && !isReplacingSignature) {
            const thumbUrl = tempSignature[0]?.url;
            return (
                <div className="mt-2">
                    {thumbUrl ? (
                        <>
                            <Space align="center">
                                <Tag color="green">✓ {t("back.contractSignature.signatureRecorded")}</Tag>
                            </Space>
                            <div className="mt-2">
                                <img
                                    src={thumbUrl}
                                    alt={t("back.contractSignature.ariaSignatureCanvas")}
                                    className="max-h-24 border rounded p-1 bg-white"
                                />
                            </div>
                        </>
                    ) : (
                        <Alert
                            type="warning"
                            showIcon
                            message={t("back.contractSignature.signatureNoPreview")}
                        />
                    )}
                    <div className="mt-2 flex gap-2">
                        <Button size="small" icon={<ReloadOutlined />} onClick={handleReplaceSignature}>
                            {t("back.contractSignature.replaceSignature")}
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-2">
                {hasExistingSignature && (
                    <Button
                        type="link"
                        size="small"
                        icon={<ArrowLeftOutlined />}
                        onClick={handleKeepSignature}
                        className="!p-0 !mb-2"
                    >
                        {t("back.contractSignature.cancelReplace")}
                    </Button>
                )}
                <Switch
                    size="default"
                    checked={useDrawMode}
                    checkedChildren={t("back.contractSignature.takeSignature")}
                    unCheckedChildren={t("general.uploadSignature")}
                    onChange={handleDrawModeChange}
                />
                {useDrawMode ? (
                    <div className="mt-2">
                        <div className="text-xs text-neutral-500 mb-1">
                            {t("back.contractSignature.signatureDrawHint")}
                        </div>
                        <div
                            ref={signatureWrapperRef}
                            className="relative bg-white"
                            style={{
                                border: "2px dashed #cbd5e1",
                                borderRadius: 6,
                                height: SIGNATURE_CANVAS_HEIGHT,
                            }}
                        >
                            {!hasDrawnStroke && (
                                <div
                                    aria-hidden="true"
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#9ca3af",
                                        pointerEvents: "none",
                                        userSelect: "none",
                                        fontSize: 14,
                                    }}
                                >
                                    {t("back.contractSignature.signHere")}
                                </div>
                            )}
                            {canvasWidth > 0 && (
                                <SignatureCanvas
                                    ref={signatureRef}
                                    penColor="blue"
                                    onBegin={handleSignatureBegin}
                                    onEnd={handleSignatureEnd}
                                    canvasProps={{
                                        width: canvasWidth,
                                        height: SIGNATURE_CANVAS_HEIGHT,
                                        style: {
                                            width: "100%",
                                            height: SIGNATURE_CANVAS_HEIGHT,
                                            display: "block",
                                            touchAction: "none",
                                            borderRadius: 6,
                                        },
                                        "aria-label": t("back.contractSignature.ariaSignatureCanvas"),
                                        role: "img",
                                    }}
                                />
                            )}
                        </div>
                        <div className="mt-1 flex justify-end">
                            <Button
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={handleClearSignature}
                                disabled={!hasDrawnStroke}
                            >
                                {t("general.clear")}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="mt-2">
                        <Upload
                            customRequest={dummyRequest}
                            fileList={
                                _.size(signatureFileList) > 0
                                    ? signatureFileList
                                    : (!isReplacingSignature && _.size(tempSignature) > 0 ? tempSignature : [])
                            }
                            accept="image/png, image/jpeg"
                            listType="picture-card"
                            maxCount={1}
                            onPreview={handleSignaturePreview}
                            onChange={(info) => {
                                handleSignatureChange(info);
                                setPreviewFresh(false);
                            }}
                        >
                            <div>
                                <UploadOutlined size={20} className="!mb-2" />
                                <p>{t("general.uploadSignature")}</p>
                            </div>
                        </Upload>
                    </div>
                )}
            </div>
        );
    };

    const renderForm = () => (
        <CommonForm
            form={form}
            name="contract-signature-form"
            layout="vertical"
            onFinish={onFinish}
            onValuesChange={onFieldsChange}
            validateTrigger={["onBlur", "onSubmit"]}
            autoComplete="off"
            disabled={isSubmitting}
        >
            <div className="mb-3">
                <div className="text-sm font-medium mb-1">{t("back.contractSignature.method")}</div>
                {!isAdmin && (
                    <Switch
                        checked={isSystemMethod}
                        checkedChildren={t("back.contractSignature.system")}
                        unCheckedChildren={t("back.contractSignature.uploadFile")}
                        onChange={handleMethodChange}
                    />
                )}
                <div className="text-xs text-neutral-500 mt-1">
                    {isAdmin
                        ? t("back.contractSignature.methodUpload")
                        : isSystemMethod
                            ? t("back.contractSignature.methodSystem")
                            : t("back.contractSignature.methodUpload")}
                </div>
            </div>

            {isSystemMethod && !isAdmin ? (
                <>
                    <Alert
                        type="warning"
                        showIcon
                        message={t("back.contractSignature.finalVersionWarning")}
                        className="!mb-3"
                    />

                    <CommonForm.Item
                        name="customerName"
                        label={t("back.contractSignature.customerName")}
                        rules={[{ required: true, message: t("back.contractSignature.requireCustomerName") }]}
                        required
                    >
                        <Input size="large" maxLength={120} />
                    </CommonForm.Item>

                    <CommonForm.Item
                        name="customerPosition"
                        label={t("back.contractSignature.customerCompany")}
                        rules={[{ required: true, message: t("back.contractSignature.requireCustomerCompany") }]}
                        required
                    >
                        <Input size="large" maxLength={120} />
                    </CommonForm.Item>

                    <div className="text-sm font-medium mt-3">{t("back.contractSignature.signature")}</div>
                    {renderSignaturePanel()}

                    {!previewFresh ? (
                        <Alert
                            type="info"
                            showIcon
                            message={t("back.contractSignature.hintNeedPreview")}
                            className="!mt-3"
                        />
                    ) : (
                        <Alert
                            type="success"
                            showIcon
                            message={t("back.contractSignature.previewReady")}
                            className="!mt-3"
                        />
                    )}

                    <div className="mt-3 flex gap-2">
                        <Button
                            type={previewFresh ? "default" : "primary"}
                            onClick={handlePreviewClick}
                            loading={isPreviewing}
                            disabled={isPreviewing || isSubmitting}
                            block
                        >
                            {t("general.buttonPreView")}
                        </Button>
                    </div>
                </>
            ) : (
                <CommonForm.Item
                    name="contractPath"
                    rules={[{ required: true, message: t("back.contract.fileRequired") }]}
                    required
                >
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
                            if (info.fileList?.length > 0 && info.fileList[0].originFileObj) {
                                const file = info.fileList[0].originFileObj;
                                setFileURL(URL.createObjectURL(file));
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
    );

    const pdfHeight = isMobile ? "min(60vh, 520px)" : "min(75vh, 720px)";
    const pdfMinHeight = isMobile ? 320 : 420;

    const pdfNode = (
        <>
            <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">{t("back.contractSignature.tabPdf")}</div>
                <Tooltip title={t("back.contractSignature.openPdfNewTab")}>
                    <Button
                        size="small"
                        type="text"
                        icon={<ExportOutlined />}
                        onClick={handleOpenInNewTab}
                        disabled={!fileURL}
                    />
                </Tooltip>
            </div>
            {fileURL ? (
                <iframe
                    allowFullScreen
                    src={fileURL}
                    style={{
                        width: "100%",
                        height: pdfHeight,
                        minHeight: pdfMinHeight,
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                    }}
                    title="Contract PDF"
                />
            ) : (
                <div
                    className="flex items-center justify-center text-neutral-400 bg-neutral-50 rounded"
                    style={{ height: pdfHeight, minHeight: pdfMinHeight }}
                >
                    {t("back.contractSignature.noPdfAvailable")}
                </div>
            )}
            {isPreviewing && (
                <div className="text-xs text-neutral-500 mt-1">
                    {t("back.contractSignature.loadingPreview")}
                </div>
            )}
        </>
    );

    const showForm = (roleUser === "organizer" || isAdmin) && !isAlreadySigned;

    const renderBody = () => {
        if (isMobile && showForm) {
            return (
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={[
                        { key: "pdf", label: t("back.contractSignature.tabPdf"), children: pdfNode },
                        { key: "form", label: t("back.contractSignature.tabForm"), children: renderForm() },
                    ]}
                />
            );
        }
        return (
            <Row gutter={[16, 16]}>
                <Col xs={24} md={showForm ? 16 : 24}>{pdfNode}</Col>
                {showForm && <Col xs={24} md={8}>{renderForm()}</Col>}
            </Row>
        );
    };

    const saveTooltip = saveDisabled && !isSubmitting && !isPreviewing && isSystemMethod && !isAdmin && !previewFresh
        ? t("back.contractSignature.tooltipSaveDisabled")
        : "";

    const renderFooter = () => {
        const cancelBtn = (
            <Button onClick={handleModalCancel} disabled={isSubmitting}>
                {isAlreadySigned ? t("general.buttonClose") : t("general.buttonCancel")}
            </Button>
        );
        if (isAlreadySigned) return cancelBtn;
        const saveBtn = (
            <Button
                type="primary"
                onClick={() => form.submit()}
                disabled={saveDisabled}
                loading={isSubmitting}
            >
                {t("general.buttonSave")}
            </Button>
        );
        return (
            <Space>
                {cancelBtn}
                {saveTooltip ? (
                    <Tooltip title={saveTooltip}>
                        <span>{saveBtn}</span>
                    </Tooltip>
                ) : saveBtn}
            </Space>
        );
    };

    return (
        <Modal
            width="92%"
            className="md:!max-w-screen-xl !mx-auto !pt-3"
            title={
                contractData?.runNo
                    ? t("back.contractSignature.titleContractWithRunNo", { runNo: contractData.runNo })
                    : t("back.contractSignature.titleContract")
            }
            open={open}
            footer={renderFooter()}
            onCancel={handleModalCancel}
            maskClosable={false}
            keyboard={!isSubmitting}
            destroyOnHidden
        >
            <Spin
                spinning={isFetchingContract || isSubmitting}
                tip={isSubmitting ? t("back.contractSignature.savingPleaseWait") : ""}
            >
                {(roleUser === "organizer" || isAdmin) && renderSummary()}
                {isAlreadySigned && (
                    <Alert
                        type="success"
                        showIcon
                        message={t("back.contractSignature.alreadySigned")}
                        description={
                            contractData?.customerName
                                ? `${t("back.contractSignature.signedBy")}: ${contractData.customerName}`
                                : null
                        }
                        className="!mb-3"
                    />
                )}
                {renderBody()}
            </Spin>

            <Modal open={signaturePreviewOpen} footer={null} onCancel={handleSignatureCancel}>
                <img
                    alt="signature-img"
                    style={{ width: "100%" }}
                    src={signaturePreviewImage}
                />
            </Modal>
        </Modal>
    );
};

export default ContractSignature;
