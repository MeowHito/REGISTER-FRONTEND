import React, { useEffect, useState } from 'react'
import { Col, Modal, Row, Spin } from 'antd';
import CommonForm from "components/commonForm";
import { AlertSuccess, AlertError, AlertConfirm, AlertClosed } from 'components/alert';
import backOfficeServices from "services/backoffice.services";
import { errorToMessage } from 'hooks/functions/errorToMessage';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import FloatingLabel from 'components/floatingLabel';
import ProvinceSelector from 'components/provinceSelector';
import { validateIDCard } from 'utils/validate';
import { toStartOfDayISO } from 'utils/format';
import { useMediaQuery } from 'react-responsive';

const UserProfile = ({ data, open, onCancel, refetch, nationalityOption, isLoadingNationality, genderOption, bloodGroupOption }) => {
    const { t } = useTranslation();
    const [form] = CommonForm.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
    const rowGutter = isMobile ? [16, 8] : [16, 16];



    const { data: userProfileData, refetch: refetchUserProfile, isFetching } = backOfficeServices.useQueryGetUserById({
        id: data?.id
    });

    useEffect(() => {
        if (userProfileData) {
            let data = {
                ...userProfileData,
                birthDate: userProfileData?.birthDate ? dayjs(userProfileData?.birthDate) : null,
                tranferApprover: false,
                takeSignature: false
            };
            form.setFieldsValue(data);
        }
    }, [userProfileData]);

    useEffect(() => {
        if (open && data && userProfileData) {
            refetchUserProfile();
        } else if (form.__INTERNAL__.name) {
            form.resetFields();
        }
    }, [open]);

    const { mutateAsync: updateUserProfile } = backOfficeServices.useMutationUpdateUser(
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

    const onFinish = (values) => {
        AlertConfirm({
            onOk: async () => {
                try {
                    setIsSubmitting(true);
                    let isUpdate = {
                        ...userProfileData,
                        ...values,
                        birthDate: toStartOfDayISO(values?.birthDate),
                    };
                    await updateUserProfile(isUpdate);
                } catch (err) {
                    AlertError({ text: errorToMessage(err) })
                } finally {
                    setIsSubmitting(false);
                }
            },
        });
    };

    return (
        <div>
            <Modal
                width={"90%"}
                className='md:!max-w-screen-lg !mx-auto !pt-3'
                title={t("back.setting.user.form.edit") + " : " + userProfileData?.email}
                open={open}
                okButtonProps={{
                    disabled: isSubmitting,
                    loading: isSubmitting
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
                okText={t("general.buttonSave")}
                cancelText={t("general.buttonCancel")}
            >
                <Spin spinning={isFetching}>
                    <CommonForm
                        form={form}
                        name="user-setting-profile"
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                    >
                        <div className="grid gap-2">
                            <div className="text-xl font-semibold mb-4">{t("back.setting.user.form.personal")}</div>
                            <Row gutter={rowGutter}>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="firstName"
                                    >
                                        <FloatingLabel size="large" label={t("back.setting.user.form.firstName")} />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="lastName"
                                    >
                                        <FloatingLabel size="large" label={t("back.setting.user.form.lastName")} />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="gender"
                                    >
                                        <FloatingLabel type="radio" size="large" optionType="default" label={t("back.setting.user.form.gender")} options={genderOption} />
                                    </CommonForm.Item>
                                </Col>
                            </Row>
                            <Row gutter={rowGutter}>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="firstNameEn"
                                        rules={[
                                            {
                                                pattern: /^[A-Za-z\s]+$/,
                                                message: t("validation.en"),
                                            },
                                        ]}
                                    >
                                        <FloatingLabel size="large" label={t("back.setting.user.form.firstNameEn")} />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="lastNameEn"
                                        rules={[
                                            {
                                                pattern: /^[A-Za-z\s]+$/,
                                                message: t("validation.en"),
                                            },
                                        ]}
                                    >
                                        <FloatingLabel size="large" label={t("back.setting.user.form.lastNameEn")} />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="nationality"
                                    >
                                        <FloatingLabel
                                            type="select"
                                            showSearch
                                            disabled={isLoadingNationality}
                                            label={t("back.setting.user.form.nationality")}
                                            size="large"
                                            options={nationalityOption}
                                        />
                                    </CommonForm.Item>
                                </Col>
                            </Row>
                            <Row gutter={rowGutter}>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="idNo"
                                        rules={[
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
                                        <FloatingLabel maxLength={20} size="large" label={t("back.setting.user.form.idNo")} />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="birthDate"
                                    >
                                        <FloatingLabel
                                            type="date"
                                            size="large"
                                            label={t("back.setting.user.form.birthDate")}
                                            required
                                        />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="phone"
                                        rules={[
                                            {
                                                pattern: /^[0-9]{7,15}$/,
                                                message: t("validation.phone"),
                                            },
                                        ]}
                                    >
                                        <FloatingLabel
                                            type="phone"
                                            maxLength={15}
                                            size="large"
                                            label={t("general.tel")}
                                        />
                                    </CommonForm.Item>
                                </Col>
                            </Row>
                            <Row gutter={rowGutter}>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="bloodType"
                                    >
                                        <FloatingLabel
                                            type="select"
                                            size="large"
                                            label={t("back.setting.user.form.bloodGroup")}
                                            options={bloodGroupOption}
                                        />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="healthIssues"
                                    >
                                        <FloatingLabel size="large" label={t("back.setting.user.form.healthIssues")} />
                                    </CommonForm.Item>
                                </Col>
                                {userProfileData?.role?.roleType === "organizer" && (
                                    <Col xs={24} md={8}>
                                        <CommonForm.Item
                                            name="companyName"
                                            rules={[
                                                {
                                                    required: true,
                                                    message: t("required.companyName"),
                                                },
                                            ]}
                                        >
                                            <FloatingLabel size="large" label={t("back.setting.user.form.companyName")} required />
                                        </CommonForm.Item>
                                    </Col>
                                )}
                            </Row>
                            <div className="text-xl font-semibold mb-3">{t("back.setting.user.form.titleEmergencyContact")} </div>
                            <Row gutter={rowGutter}>
                                <Col xs={24} md={16}>
                                    <CommonForm.Item
                                        name="emergencyContact"
                                    >
                                        <FloatingLabel size="large" label={t("back.setting.user.form.emergencyContact")} />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <CommonForm.Item
                                        name="emergencyPhone"
                                        rules={[
                                            {
                                                pattern: /^[0-9]{7,15}$/,
                                                message: t("validation.phone"),
                                            },
                                        ]}
                                    >
                                        <FloatingLabel
                                            type="phone"
                                            maxLength={15}
                                            size="large"
                                            label={t("general.tel")}
                                        />
                                    </CommonForm.Item>
                                </Col>
                            </Row>
                            <div className="text-xl font-semibold mb-3">{t("back.setting.user.form.titleAddress")}</div>
                            <CommonForm.Item name="address">
                                <FloatingLabel size="large" label={t("back.setting.user.form.address")} />
                            </CommonForm.Item>
                            <ProvinceSelector
                                form={form}
                                rowGutter={rowGutter}
                                fieldNames={{
                                    zipcode: "zipcode",
                                    province: "province",
                                    amphoe: "amphoe",
                                    district: "district",
                                }}
                                compact
                                labels={{
                                    zipcode: t("back.setting.user.form.zipcode"),
                                    province: t("back.setting.user.form.province"),
                                    amphoe: t("back.setting.user.form.amphoe"),
                                    district: t("back.setting.user.form.district"),
                                }}
                            />
                            <div className="text-xl font-semibold mb-3">{t("back.setting.user.form.titleShippingAddress")}</div>
                            <CommonForm.Item name="shippingAddress">
                                <FloatingLabel size="large" label={t("back.setting.user.form.shippingAddress")} />
                            </CommonForm.Item>
                            <ProvinceSelector
                                form={form}
                                rowGutter={rowGutter}
                                fieldNames={{
                                    zipcode: "shippingZipcode",
                                    province: "shippingProvince",
                                    amphoe: "shippingAmphoe",
                                    district: "shippingDistrict",
                                }}
                                compact
                                labels={{
                                    zipcode: t("back.setting.user.form.shippingZipcode"),
                                    province: t("back.setting.user.form.shippingProvince"),
                                    amphoe: t("back.setting.user.form.shippingAmphoe"),
                                    district: t("back.setting.user.form.shippingDistrict"),
                                }}
                            />
                        </div>
                    </CommonForm>
                </Spin>
            </Modal>
        </div>
    )
}

export default UserProfile

