import React, { useEffect } from 'react';
import { Input, Modal } from 'antd';
import CommonForm from "components/commonForm";
import { useTranslation } from 'react-i18next';
import { errorToMessage } from 'hooks/functions/errorToMessage';
import { AlertSuccess, AlertError, AlertClosed, AlertConfirm, AlertWarning } from 'components/alert';
import backOfficeServices from 'services/backoffice.services';
import FloatingLabel from 'components/floatingLabel';

const ResetPassword = ({ open, onCancel, data, refetch }) => {
    const { t } = useTranslation();
    const [form] = CommonForm.useForm();

    useEffect(() => {
        if (open) {
            form.resetFields();
        }
    }, [open, data]);

    const { mutate: updatePassword } = backOfficeServices.useMutationResetPassword(
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

    const onFinish = async (values) => {
        const { newPassword, confirmPassword } = values;
        if (newPassword !== confirmPassword) {
            AlertWarning({ text: t("general.matchPassword") });
        } else {
            AlertConfirm({
                onOk: () => {
                    let isUpdate = {
                        id: data?.id,
                        npw: newPassword,
                    };
                    updatePassword(isUpdate);
                },
            });
        }
    };
    return (
        <Modal
            title={t('back.setting.user.resetPassword.resetPassword') + " : " + data?.email}
            open={open}
            onOk={() => {
                form.submit();
            }}
            onCancel={() => {
                if (!data) {
                    form.resetFields();
                }
                onCancel();
            }}
            okText={t("general.buttonSave")}
            cancelText={t("general.buttonCancel")}
            styles={{
                body: {
                    paddingTop: 8,
                },
            }}
        >
            <CommonForm
                form={form}
                name="user-reset"
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
            >
                <CommonForm.Item
                    name="newPassword"
                    rules={[
                        { required: true, message: t('required.newPassword') },
                        { min: 8, message: t('back.setting.user.resetPassword.passwordMinLength') },
                    ]}
                >
                    <FloatingLabel label={t('back.setting.user.resetPassword.newPassword')} type="password" required />
                </CommonForm.Item>

                <CommonForm.Item
                    name="confirmPassword"
                    dependencies={['newPassword']}
                    rules={[
                        { required: true, message: t('required.confirmPassword') },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('newPassword') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error(t('back.setting.user.resetPassword.passwordMismatch')));
                            },
                        }),
                    ]}
                >
                    <FloatingLabel label={t('back.setting.user.resetPassword.confirmPassword')} type="password" required />
                </CommonForm.Item>
            </CommonForm>
        </Modal>
    );
};

export default ResetPassword;

