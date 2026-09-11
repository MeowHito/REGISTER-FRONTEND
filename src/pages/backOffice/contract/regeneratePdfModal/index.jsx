import { Alert, Input, Modal } from "antd";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import backOfficeServices from "services/backoffice.services";
import { AlertError, AlertSuccess } from "components/alert";
import { errorToMessage } from "hooks/functions/errorToMessage";

const RegeneratePdfModal = ({ record, open, onCancel, onSuccess }) => {
    const { t } = useTranslation();
    const [confirmText, setConfirmText] = useState("");

    const runNo = record?.runNo || "";

    useEffect(() => {
        if (!open) {
            setConfirmText("");
        }
    }, [open]);

    const isReady = useMemo(() => (
        confirmText.trim() === runNo
    ), [confirmText, runNo]);

    const { mutate: regenerate, isLoading } = backOfficeServices.useMutationRegenerateContractPdf(
        () => {
            AlertSuccess({ text: t("back.contractList.repairDescription") });
            if (onSuccess) onSuccess();
            onCancel();
        },
        (err) => {
            AlertError({ text: errorToMessage(err?.response?.data?.message || err) });
        }
    );

    const handleOk = () => {
        if (!isReady) return;
        regenerate({ uuid: record.id });
    };

    return (
        <Modal
            title={t("back.contractList.repairTitle", { runNo })}
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            okText={t("back.contractList.repairConfirmButton")}
            cancelText={t("general.buttonCancel")}
            okButtonProps={{ disabled: !isReady, loading: isLoading, danger: true }}
            destroyOnHidden
            maskClosable={!isLoading}
            keyboard={!isLoading}
        >
            <Alert
                type="warning"
                showIcon
                message={t("back.contractList.repairDescription")}
                description={t("back.contractList.repairWarning")}
                className="!mb-4"
            />

            <div className="mb-3">
                <div className="text-sm font-medium mb-1">
                    {t("back.contractList.repairConfirmLabel", { runNo })}
                </div>
                <Input
                    size="large"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={t("back.contractList.repairConfirmPlaceholder")}
                    status={confirmText && confirmText.trim() !== runNo ? "error" : undefined}
                    autoFocus
                />
            </div>

        </Modal>
    );
};

export default RegeneratePdfModal;
