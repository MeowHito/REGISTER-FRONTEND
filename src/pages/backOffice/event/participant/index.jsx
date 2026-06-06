import React, { useEffect, useState } from 'react'
import { Checkbox, Col, Divider, Modal, Row, Spin } from 'antd';
import {
    UserOutlined,
    PhoneOutlined,
    HeartOutlined,
    TrophyOutlined,
    FormOutlined,
} from '@ant-design/icons';
import CommonForm from "components/commonForm";
import { AlertSuccess, AlertError, AlertConfirm, AlertClosed } from 'components/alert';
import backOfficeServices from "services/backoffice.services";
import { errorToMessage } from 'hooks/functions/errorToMessage';
import { useTranslation } from 'react-i18next';
import FloatingLabel from 'components/floatingLabel';
import { validateIDCard } from 'utils/validate';
import { toStartOfDay, toStartOfDayISO } from "utils/format";
import dayjs from 'dayjs';
import { SYS_DATE_FORMAT } from 'constants/helper';
import { bloodGroupOption } from 'constants/options/bloodGroupOption';
import useCountryStateHook from 'hooks/useCountryStateHook';

const SectionHeader = ({ icon, title }) => (
    <Divider orientation="left" orientationMargin={0} style={{ marginTop: 8, marginBottom: 12 }}>
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            {icon}
            {title}
        </span>
    </Divider>
);

const QuestionCard = ({ index, label, required, children }) => (
    <div className="rounded-lg border border-gray-200 bg-white p-4 mb-3 transition-shadow hover:shadow-sm">
        <div className="flex items-start gap-2 mb-3">
            <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mt-0.5">
                {index + 1}
            </span>
            <span className="text-sm font-semibold text-gray-800 leading-snug">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </span>
        </div>
        {children}
    </div>
);

const Participant = ({ isEditable, data, open, onCancel, refetch, mode, nationalityOption, isLoadingNationality, genderOption }) => {
    const { t, i18n } = useTranslation();
    const [form] = CommonForm.useForm();
    const [shirtSizeOptions, setShirtSizeOptions] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: participantData, refetch: refetchParticipant, isFetching } = backOfficeServices.useQueryGetParticipantById({ id: data?.id });

    const { data: shirtSizeData } = backOfficeServices.useQueryGetShirtSizeByType({ id: data?.shirtTypeId });

    const isViewMode = mode !== "edit" || !isEditable;

    const { isLoadingProvince, provinceOption } = useCountryStateHook({ valueKey: 'stateLocal' });

    useEffect(() => {
        if (participantData && open) {
            const formSelectionAnswers = {};
            const allFields = participantData?.selectionFields || [];
            (participantData?.selectionAnswers || []).forEach(({ question, value }) => {
                if (!question?.id) return;
                const field = allFields.find(f => f.id === question.id);
                if (!field) return;

                if (Array.isArray(value)) {
                    const freeTextValues = {};
                    value.forEach(v => {
                        if (v.inputType === 'FREE_TEXT' && v.freeTextValue) {
                            freeTextValues[v.id] = v.freeTextValue;
                        }
                    });
                    formSelectionAnswers[question.id] = {
                        selected: value.map(v => v.id),
                        freeTextValues,
                    };
                } else if (value?.inputType === 'FREE_TEXT') {
                    formSelectionAnswers[question.id] = {
                        selected: value.id,
                        freeText: value.freeTextValue || '',
                    };
                } else if (value?.id) {
                    const hasFreeText = (field.options || []).some(o => o.inputType === 'FREE_TEXT');
                    if (hasFreeText) {
                        formSelectionAnswers[question.id] = { selected: value.id };
                    } else {
                        formSelectionAnswers[question.id] = value.id;
                    }
                }
            });

            let _field = {
                ...participantData,
                birthDate: toStartOfDay(participantData?.birthDate),
                registerDate: participantData?.registerDate ? dayjs(participantData.registerDate).format(SYS_DATE_FORMAT) : '',
                selectionAnswers: formSelectionAnswers,
            };
            form.setFieldsValue(_field);
        }
    }, [participantData, open]);

    useEffect(() => {
        if (shirtSizeData?.length > 0) {
            const options = shirtSizeData?.map(({ name, id }) => ({
                value: id, label: name
            })) || [];
            setShirtSizeOptions(options);
        } else {
            setShirtSizeOptions([]);
        }
    }, [shirtSizeData]);

    useEffect(() => {
        if (open && data) {
            refetchParticipant();
        } else if (!open) {
            form.resetFields();
        }
    }, [open, data]);

    const { mutateAsync: updateParticipant } = backOfficeServices.useMutationUpdateParticipant(
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
        AlertConfirm({
            onOk: async () => {
                try {
                    setIsSubmitting(true);

                    const allFields = participantData?.selectionFields || [];
                    const formAnswers = values?.selectionAnswers || {};
                    const structuredAnswers = Object.entries(formAnswers)
                        .map(([questionKey, answerRaw]) => {
                            const field = allFields.find(f => f.id === questionKey);
                            if (!field || answerRaw == null) return null;

                            const question = { id: field.id, value: field.title, valueEn: field.titleEn };
                            const formatOption = (optId) => {
                                const opt = field.options?.find(o => o.id === optId);
                                return opt ? { id: opt.id, value: opt.value, valueEn: opt.valueEn, inputType: opt.inputType } : null;
                            };

                            if (typeof answerRaw === 'object' && answerRaw?.selected !== undefined) {
                                if (Array.isArray(answerRaw.selected)) {
                                    const freeTextValues = answerRaw.freeTextValues || {};
                                    const value = answerRaw.selected.map(optId => {
                                        const opt = formatOption(optId);
                                        if (!opt) return null;
                                        if (opt.inputType === 'FREE_TEXT' && freeTextValues[optId]) {
                                            return { ...opt, freeTextValue: freeTextValues[optId] };
                                        }
                                        return opt;
                                    }).filter(Boolean);
                                    return { question, value };
                                }
                                const selectedOpt = formatOption(answerRaw.selected);
                                if (selectedOpt?.inputType === 'FREE_TEXT' && answerRaw.freeText) {
                                    return { question, value: { ...selectedOpt, freeTextValue: answerRaw.freeText } };
                                }
                                return { question, value: selectedOpt };
                            }

                            if (answerRaw) {
                                return { question, value: formatOption(answerRaw) };
                            }
                            return null;
                        })
                        .filter(Boolean);

                    let isData = {
                        ...data,
                        ...values,
                        birthDate: toStartOfDayISO(values?.birthDate),
                        selectionAnswers: structuredAnswers,
                    };
                    if (data?.id) {
                        await updateParticipant(isData);
                    }
                } catch (err) {
                    AlertError({ text: errorToMessage(err) })
                } finally {
                    setIsSubmitting(false);
                }
            }
        });
    };

    return (
        <div>
            <Modal
                width={960}
                title={mode === "edit" ? t("back.event.participant.form.edit") : t("back.event.participant.form.view")}
                open={open}
                okButtonProps={{
                    disabled: !isEditable || isSubmitting,
                    loading: isSubmitting,
                    style: isViewMode ? { display: 'none' } : {},
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
                styles={{
                    body: { maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 },
                }}
            >
                <Spin spinning={isFetching}>
                    <CommonForm
                        form={form}
                        name="participant-form"
                        className="!mt-2"
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                    >
                        {/* ── Event Information (Read-only) ── */}
                        <SectionHeader
                            icon={<TrophyOutlined />}
                            title={t("back.event.participant.form.sectionEvent")}
                        />
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={6}>
                                <CommonForm.Item name="orderNo">
                                    <FloatingLabel
                                        label={t("back.event.participant.form.orderNo")}
                                        readOnly
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <CommonForm.Item name="bibNo">
                                    <FloatingLabel
                                        label={t("back.event.participant.form.bibNo")}
                                        readOnly={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <CommonForm.Item name="eventTypeName">
                                    <FloatingLabel
                                        label={t("back.event.participant.form.eventTypeName")}
                                        readOnly
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <CommonForm.Item name="teamClub">
                                    <FloatingLabel
                                        label={t("back.event.participant.form.teamName")}
                                        readOnly={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={6}>
                                <CommonForm.Item name="shirtSizeId">
                                    <FloatingLabel
                                        label={t("back.event.participant.form.shirtSize")}
                                        type="select"
                                        disabled={isViewMode || !data?.shirtSizeId}
                                        options={shirtSizeOptions}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <CommonForm.Item name="registerDate">
                                    <FloatingLabel
                                        label={t("back.event.participant.form.registerDate")}
                                        readOnly
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>

                        {/* ── Personal Information ── */}
                        <SectionHeader
                            icon={<UserOutlined />}
                            title={t("back.event.participant.form.sectionPersonal")}
                        />
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="firstName"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.firstName"),
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        label={t("back.event.participant.form.firstName")}
                                        required
                                        readOnly={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="lastName"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.lastName"),
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        label={t("back.event.participant.form.lastName")}
                                        required
                                        readOnly={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="gender"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.gender"),
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        type="radio"
                                        size="large"
                                        optionType="default"
                                        options={genderOption}
                                        label={t("back.event.participant.form.gender")}
                                        required
                                        readOnly={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>
                        <Row gutter={[16, 16]}>
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
                                    <FloatingLabel
                                        label={t("back.event.participant.form.firstNameEn")}
                                        readOnly={isViewMode}
                                    />
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
                                    <FloatingLabel
                                        label={t("back.event.participant.form.lastNameEn")}
                                        readOnly={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item name="nationality">
                                    <FloatingLabel
                                        label={t("back.event.participant.form.nationality")}
                                        type="select"
                                        showSearch
                                        disabled={isViewMode || isLoadingNationality}
                                        options={nationalityOption}
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
                                            message: t("required.idNo"),
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
                                        maxLength={20}
                                        size="large"
                                        label={t("back.event.participant.form.idNo")}
                                        required
                                        readOnly={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="birthDate"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.birthDate"),
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        type="date"
                                        size="large"
                                        label={t("back.event.participant.form.birthDate")}
                                        required
                                        disabled={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item name="province">
                                    <FloatingLabel
                                        label={t("back.event.participant.form.province")}
                                        type="select"
                                        showSearch
                                        allowClear
                                        disabled={isViewMode || isLoadingProvince}
                                        options={provinceOption}
                                        filterOption={(input, option) => {
                                            const str = option.filterLabel || (typeof option.label === 'string' ? option.label : '');
                                            return str.toLowerCase().includes(input.toLowerCase());
                                        }}
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>

                        {/* ── Contact Information ── */}
                        <SectionHeader
                            icon={<PhoneOutlined />}
                            title={t("back.event.participant.form.sectionContact")}
                        />
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <CommonForm.Item
                                    name="email"
                                    rules={[
                                        {
                                            type: 'email',
                                            message: t("validation.email"),
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        label={t("back.event.participant.form.email")}
                                        readOnly={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <CommonForm.Item
                                    name="phone"
                                    rules={[
                                        {
                                            pattern: /^0\d{9}$/,
                                            message: t("validation.phone"),
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        label={t("back.event.participant.form.phone")}
                                        readOnly={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>

                        {/* ── Health & Emergency ── */}
                        <SectionHeader
                            icon={<HeartOutlined />}
                            title={t("back.event.participant.form.sectionHealth")}
                        />
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <CommonForm.Item name="bloodType">
                                    <FloatingLabel
                                        label={t("back.event.participant.form.bloodType")}
                                        type="select"
                                        options={bloodGroupOption}
                                        disabled={isViewMode}
                                        allowClear
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={16}>
                                <CommonForm.Item name="healthIssues">
                                    <FloatingLabel
                                        label={t("back.event.participant.form.healthIssues")}
                                        readOnly={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <CommonForm.Item name="emergencyContact">
                                    <FloatingLabel
                                        label={t("back.event.participant.form.emergencyContact")}
                                        readOnly={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item name="emergencyRelation">
                                    <FloatingLabel
                                        label={t("back.event.participant.form.emergencyRelation")}
                                        readOnly={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="emergencyPhone"
                                    rules={[
                                        {
                                            pattern: /^0\d{9}$/,
                                            message: t("validation.phone"),
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        label={t("back.event.participant.form.emergencyPhone")}
                                        readOnly={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>

                        {/* ── Additional Questions ── */}
                        {(participantData?.selectionFields?.length > 0) && (() => {
                            const currentLang = i18n.language?.toLowerCase() || 'th';
                            return (
                                <>
                                    <SectionHeader
                                        icon={<FormOutlined />}
                                        title={t("back.event.participant.form.sectionQuestions")}
                                    />
                                    {participantData.selectionFields.map((field, index) => {
                                        const questionLabel = currentLang === 'en' ? field.titleEn || field.title : field.title;
                                        const rules = field.required
                                            ? [{ required: true, message: t("required.selectionField", { title: questionLabel }) }]
                                            : [];
                                        const fixedOptions = (field.options || []).filter(o => o.inputType !== 'FREE_TEXT');
                                        const freeTextOption = (field.options || []).find(o => o.inputType === 'FREE_TEXT');
                                        const selectOptions = fixedOptions.map(o => ({
                                            value: o.id,
                                            label: currentLang === 'en' ? o.valueEn || o.value : o.value,
                                        }));

                                        /* ── MULTIPLE ── */
                                        if (field.type === 'MULTIPLE') {
                                            const freeTextOptions = (field.options || []).filter(o => o.inputType === 'FREE_TEXT');
                                            const freeTextOptionIds = new Set(freeTextOptions.map(o => o.id));
                                            return (
                                                <QuestionCard key={field.id} index={index} label={questionLabel} required={field.required}>
                                                    <CommonForm.Item
                                                        name={['selectionAnswers', field.id, 'selected']}
                                                        className="!mb-0"
                                                        rules={rules}
                                                    >
                                                        <Checkbox.Group
                                                            disabled={isViewMode}
                                                            className="!flex !flex-col gap-2 w-full"
                                                        >
                                                            {(field.options || []).map(option => {
                                                                const optLabel = currentLang === 'en' ? option.valueEn || option.value : option.value;
                                                                const isFreeText = freeTextOptionIds.has(option.id);
                                                                return (
                                                                    <div key={option.id}>
                                                                        <label className="qa-option-card">
                                                                            <Checkbox value={option.id} disabled={isViewMode} className="!mr-0" />
                                                                            <span className="text-sm text-gray-700 leading-snug select-none flex-1 ml-2">{optLabel}</span>
                                                                        </label>
                                                                        {isFreeText && (
                                                                            <CommonForm.Item
                                                                                noStyle
                                                                                shouldUpdate={(prev, cur) => {
                                                                                    const p = prev?.selectionAnswers?.[field.id]?.selected;
                                                                                    const c = cur?.selectionAnswers?.[field.id]?.selected;
                                                                                    return JSON.stringify(p) !== JSON.stringify(c);
                                                                                }}
                                                                            >
                                                                                {({ getFieldValue }) => {
                                                                                    const sel = getFieldValue(['selectionAnswers', field.id, 'selected']) || [];
                                                                                    if (!Array.isArray(sel) || !sel.includes(option.id)) return null;
                                                                                    return (
                                                                                        <div className="mt-1.5 ml-9 mr-1 mb-1">
                                                                                            <CommonForm.Item
                                                                                                name={['selectionAnswers', field.id, 'freeTextValues', option.id]}
                                                                                                className="!mb-0"
                                                                                                rules={field.required ? [{ required: true, message: t("required.freeTextAnswer") }] : []}
                                                                                            >
                                                                                                <FloatingLabel
                                                                                                    label={optLabel}
                                                                                                    required={field.required}
                                                                                                    readOnly={isViewMode}
                                                                                                    allowClear
                                                                                                />
                                                                                            </CommonForm.Item>
                                                                                        </div>
                                                                                    );
                                                                                }}
                                                                            </CommonForm.Item>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </Checkbox.Group>
                                                    </CommonForm.Item>
                                                </QuestionCard>
                                            );
                                        }

                                        /* ── SINGLE with FREE_TEXT option ── */
                                        if (freeTextOption) {
                                            return (
                                                <QuestionCard key={field.id} index={index} label={questionLabel} required={field.required}>
                                                    <CommonForm.Item
                                                        name={['selectionAnswers', field.id, 'selected']}
                                                        className="!mb-0"
                                                        rules={rules}
                                                    >
                                                        <FloatingLabel
                                                            type="select"
                                                            label={questionLabel}
                                                            disabled={isViewMode}
                                                            options={[
                                                                ...selectOptions,
                                                                {
                                                                    value: freeTextOption.id,
                                                                    label: currentLang === 'en' ? freeTextOption.valueEn || freeTextOption.value || t("back.event.form.other") : freeTextOption.value || t("back.event.form.other"),
                                                                }
                                                            ]}
                                                            allowClear
                                                            showSearch
                                                        />
                                                    </CommonForm.Item>
                                                    <CommonForm.Item
                                                        noStyle
                                                        shouldUpdate={(prev, cur) => {
                                                            const p = prev?.selectionAnswers?.[field.id]?.selected;
                                                            const c = cur?.selectionAnswers?.[field.id]?.selected;
                                                            return p !== c;
                                                        }}
                                                    >
                                                        {({ getFieldValue }) => {
                                                            const sel = getFieldValue(['selectionAnswers', field.id, 'selected']);
                                                            if (sel !== freeTextOption.id) return null;
                                                            return (
                                                                <div className="mt-3">
                                                                    <CommonForm.Item
                                                                        name={['selectionAnswers', field.id, 'freeText']}
                                                                        className="!mb-0"
                                                                        rules={field.required ? [{ required: true, message: t("required.freeTextAnswer") }] : []}
                                                                    >
                                                                        <FloatingLabel
                                                                            label={t("back.event.form.enterText")}
                                                                            required={field.required}
                                                                            readOnly={isViewMode}
                                                                            allowClear
                                                                        />
                                                                    </CommonForm.Item>
                                                                </div>
                                                            );
                                                        }}
                                                    </CommonForm.Item>
                                                </QuestionCard>
                                            );
                                        }

                                        /* ── SINGLE plain ── */
                                        return (
                                            <QuestionCard key={field.id} index={index} label={questionLabel} required={field.required}>
                                                <CommonForm.Item
                                                    name={['selectionAnswers', field.id]}
                                                    className="!mb-0"
                                                    rules={rules}
                                                >
                                                    <FloatingLabel
                                                        type="select"
                                                        label={questionLabel}
                                                        disabled={isViewMode}
                                                        options={selectOptions}
                                                        allowClear
                                                        showSearch
                                                    />
                                                </CommonForm.Item>
                                            </QuestionCard>
                                        );
                                    })}
                                </>
                            );
                        })()}
                    </CommonForm>
                </Spin>
            </Modal>
        </div>
    )
}

export default Participant


