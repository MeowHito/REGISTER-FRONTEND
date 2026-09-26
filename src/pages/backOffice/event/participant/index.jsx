import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Checkbox, Col, Divider, Modal, Row, Spin } from 'antd';
import {
    UserOutlined,
    PhoneOutlined,
    HeartOutlined,
    TrophyOutlined,
    FormOutlined,
    GiftOutlined,
    HomeOutlined,
    CarOutlined,
    HistoryOutlined,
} from '@ant-design/icons';
import PhoneInput from 'components/phoneInput';
import { Rate, Image as AntImage } from 'antd';
import CommonForm from "components/commonForm";
import AddOnList from "components/addOnList";
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
import masterService from 'services/master.services';

// Only the number is stored; the document type is inferred from it (13 digits = Thai ID card).
const ID_TYPE_OPTIONS = [
    { value: 'citizen', label: 'back.event.participant.form.idTypeCitizen' },
    { value: 'passport', label: 'back.event.participant.form.idTypePassport' },
];
const isThaiIdNo = (v) => /^\d{13}$/.test(v || '');

// Change-log field key (backend) → label key under back.event.participant.form.
const EDIT_FIELD_LABEL = {
    eventType: 'eventTypeName',
    teamClub: 'teamName',
};

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

const Participant = ({ isEditable, data, open, onCancel, refetch, mode, nationalityOption, isLoadingNationality, genderOption, eventId, eventTypeOption = [] }) => {
    const { t, i18n } = useTranslation();
    const [form] = CommonForm.useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Seed data stores the province as a countryState uuid, the registration page as its Thai name.
    // The select works on names; an untouched uuid is sent back as it was so it isn't logged as an edit.
    const provinceRaw = useRef(null);

    const { data: participantData, refetch: refetchParticipant, isFetching } = backOfficeServices.useQueryGetParticipantById({ id: data?.id });
    const { data: eventData } = backOfficeServices.useQueryGetEventById({ id: eventId, enabled: open });
    const { data: countryStates } = masterService.useQueryGetAllCountryState();

    const isViewMode = mode !== "edit" || !isEditable;

    const { isLoadingProvince, provinceOption } = useCountryStateHook({ valueKey: 'stateLocal' });

    const shirtTypes = useMemo(() => eventData?.shirtTypes || [], [eventData]);
    const shirtTypeId = CommonForm.useWatch('shirtTypeId', form);
    const eventTypeId = CommonForm.useWatch('eventTypeId', form);
    const idType = CommonForm.useWatch('idType', form);
    const shirtTypeOptions = useMemo(() => shirtTypes.map(({ id, name }) => ({ value: id, label: name })), [shirtTypes]);
    const shirtSizeOptions = useMemo(() => {
        const type = shirtTypes.find((s) => s.id === shirtTypeId);
        return (type?.shirtSizes || []).map(({ id, name }) => ({ value: id, label: name }));
    }, [shirtTypes, shirtTypeId]);
    // Finisher / special styles are edited under extraShirts.<CATEGORY>; the race shirt stays above.
    const extraCategories = useMemo(() => ['FINISHER', 'SPECIAL'].filter((c) => shirtTypes.some((s) => s.category === c)), [shirtTypes]);
    const extraShirts = CommonForm.useWatch('extraShirts', form) || {};
    const extraTypeOptions = (category) => shirtTypes.filter((s) => s.category === category).map(({ id, name }) => ({ value: id, label: name }));
    const extraSizeOptions = (category) => {
        const type = shirtTypes.find((s) => s.id === extraShirts?.[category]?.shirtTypeId);
        return (type?.shirtSizes || []).map(({ id, name }) => ({ value: id, label: name }));
    };
    const deliveryByPost = participantData?.deliveryMethod === 'post'
        || ['shippingAddress', 'shippingProvince', 'shippingAmphoe', 'shippingDistrict', 'shippingZipcode'].some((k) => participantData?.[k]);
    const edits = [...(participantData?.manualEdits || [])].reverse();
    const fieldLabel = (key) => t(`back.event.participant.form.${EDIT_FIELD_LABEL[key] || key}`);
    const fmtEditTime = (v) => (v ? dayjs(v).format(`${SYS_DATE_FORMAT} HH:mm`) : '-');

    useEffect(() => {
        if (participantData && open) {
            const formSelectionAnswers = {};
            const allFields = participantData?.selectionFields || [];
            (participantData?.selectionAnswers || []).forEach(({ question, value }) => {
                if (!question?.id) return;
                const field = allFields.find(f => f.id === question.id);
                if (!field) return;

                if (['TEXT', 'RATING', 'IMAGE'].includes(field.type)) {
                    formSelectionAnswers[question.id] = value && typeof value === 'object' && !Array.isArray(value) ? value.value : value;
                    return;
                }

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

            const state = (countryStates || []).find((c) => c.id === participantData?.province);
            provinceRaw.current = state ? { raw: participantData.province, shown: state.stateLocal } : null;

            let _field = {
                ...participantData,
                province: state ? state.stateLocal : participantData?.province,
                idType: !participantData?.idNo || isThaiIdNo(participantData.idNo) ? 'citizen' : 'passport',
                birthDate: toStartOfDay(participantData?.birthDate),
                registerDate: participantData?.registerDate ? dayjs(participantData.registerDate).format(SYS_DATE_FORMAT) : '',
                selectionAnswers: formSelectionAnswers,
                phoneCountryCode: participantData?.phoneCountryCode || '+66',
                emergencyPhoneCountryCode: participantData?.emergencyPhoneCountryCode || '+66',
                extraShirts: Object.fromEntries((participantData?.shirts || [])
                    .filter((sh) => sh.category && sh.category !== 'RACE')
                    .map((sh) => [sh.category, { shirtTypeId: sh.shirtTypeId, shirtSizeId: sh.shirtSizeId }])),
            };
            form.setFieldsValue(_field);
        }
    }, [participantData, open, countryStates]);

    // Re-check the number under the newly chosen document type.
    useEffect(() => {
        if (open && !isViewMode && form.getFieldValue('idNo')) {
            form.validateFields(['idNo']).catch(() => {});
        }
        // Only on a type switch, not on every open/mode change.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idType]);

    useEffect(() => {
        if (open && data) {
            refetchParticipant();
        } else if (!open) {
            form.resetFields();
        }
    }, [open, data]);

    const { mutateAsync: updateParticipant } = backOfficeServices.useMutationUpdateParticipant(
        (res, payload) => {
            const { success, message, data: code } = res;
            // The new distance is full: saved nothing yet, ask and resend with the override.
            if (!success && code === 'OVER_QUOTA') {
                AlertConfirm({
                    text: t("back.event.participant.form.overQuotaConfirm", { message, interpolation: { escapeValue: false } }),
                    onOk: () => updateParticipant({ ...payload, confirmOverQuota: true }),
                });
                return;
            }
            if (success) {
                form.resetFields();
                refetch(payload);
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
                            if (field.type === 'TEXT' || field.type === 'RATING') {
                                return answerRaw === '' ? null : { question, value: answerRaw };
                            }
                            if (field.type === 'IMAGE') {
                                return answerRaw ? { question, value: { value: answerRaw, inputType: 'IMAGE' } } : null;
                            }
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

                    const province = provinceRaw.current && values?.province === provinceRaw.current.shown
                        ? provinceRaw.current.raw
                        : values?.province;
                    const { extraShirts: extraShirtMap, ...rest } = values || {};
                    let isData = {
                        ...data,
                        ...rest,
                        province,
                        birthDate: toStartOfDayISO(values?.birthDate),
                        selectionAnswers: structuredAnswers,
                        shirts: Object.entries(extraShirtMap || {})
                            .filter(([, v]) => v?.shirtTypeId)
                            .map(([category, v]) => ({ category, shirtTypeId: v.shirtTypeId, shirtSizeId: v.shirtSizeId })),
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
                        {/* ── Manual edits by an admin/organizer ── */}
                        {edits.length > 0 && (
                            <div className="mb-4 rounded-lg border border-[#fdba74] bg-[#fff7ed] px-4 py-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-[#c2410c]">
                                    <HistoryOutlined />
                                    {t("back.event.participant.form.editedBanner", { by: edits[0].by, time: fmtEditTime(edits[0].time), interpolation: { escapeValue: false } })}
                                </div>
                                <div className="mt-2 max-h-40 overflow-y-auto">
                                    <div className="text-xs font-semibold text-[#9a3412] mb-1">{t("back.event.participant.form.editHistory")}</div>
                                    {edits.map((entry, i) => (
                                        <div key={i} className="py-1.5 border-t border-[#fed7aa] first:border-0 text-xs text-[#431407]">
                                            <div className="text-[#9a3412]">{fmtEditTime(entry.time)} · {entry.by}</div>
                                            {(entry.changes || []).map((c, j) => (
                                                <div key={j} className="ml-3 break-words">
                                                    <span className="font-semibold">{fieldLabel(c.field)}:</span>{' '}
                                                    <span className="line-through opacity-70">{c.before ?? t("back.event.participant.form.emptyValue")}</span>
                                                    {' → '}
                                                    <span className="font-semibold">{c.after ?? t("back.event.participant.form.emptyValue")}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Event Information ── */}
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
                                <CommonForm.Item
                                    name="eventTypeId"
                                    extra={!isViewMode && eventTypeId && eventTypeId !== participantData?.eventTypeId
                                        ? <span className="text-xs text-[#c2410c]">{t("back.event.participant.form.eventTypeChangeNote")}</span>
                                        : null}
                                >
                                    <FloatingLabel
                                        label={t("back.event.participant.form.eventTypeName")}
                                        type="select"
                                        disabled={isViewMode}
                                        options={eventTypeOption.some((o) => o.value === participantData?.eventTypeId)
                                            ? eventTypeOption
                                            : [...eventTypeOption, { value: participantData?.eventTypeId, label: participantData?.eventTypeName }]}
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
                            {shirtTypes.length > 0 && (
                                <Col xs={24} md={6}>
                                    <CommonForm.Item name="shirtTypeId">
                                        <FloatingLabel
                                            label={t("back.event.participant.form.shirtType")}
                                            type="select"
                                            disabled={isViewMode}
                                            options={shirtTypeOptions}
                                            onChange={() => form.setFieldValue('shirtSizeId', undefined)}
                                        />
                                    </CommonForm.Item>
                                </Col>
                            )}
                            <Col xs={24} md={6}>
                                <CommonForm.Item
                                    name="shirtSizeId"
                                    rules={shirtTypeId ? [{ required: true, message: t("required.shirtSize") }] : []}
                                >
                                    <FloatingLabel
                                        label={t("back.event.participant.form.shirtSize")}
                                        type="select"
                                        disabled={isViewMode || !shirtTypeId}
                                        options={shirtSizeOptions.length || !participantData?.shirtSizeId
                                            ? shirtSizeOptions
                                            : [{ value: participantData.shirtSizeId, label: participantData.shirtSizeName }]}
                                    />
                                </CommonForm.Item>
                            </Col>
                            {extraCategories.map((category) => (
                                <React.Fragment key={category}>
                                    <Col xs={24} md={6}>
                                        <CommonForm.Item name={['extraShirts', category, 'shirtTypeId']}>
                                            <FloatingLabel
                                                label={t(`back.event.participant.form.extraShirtType.${category}`)}
                                                type="select"
                                                disabled={isViewMode}
                                                options={extraTypeOptions(category)}
                                                allowClear
                                                onChange={() => form.setFieldValue(['extraShirts', category, 'shirtSizeId'], undefined)}
                                            />
                                        </CommonForm.Item>
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <CommonForm.Item
                                            name={['extraShirts', category, 'shirtSizeId']}
                                            rules={extraShirts?.[category]?.shirtTypeId ? [{ required: true, message: t("required.shirtSize") }] : []}
                                        >
                                            <FloatingLabel
                                                label={t(`back.event.participant.form.extraShirtSize.${category}`)}
                                                type="select"
                                                disabled={isViewMode || !extraShirts?.[category]?.shirtTypeId}
                                                options={extraSizeOptions(category)}
                                            />
                                        </CommonForm.Item>
                                    </Col>
                                </React.Fragment>
                            ))}
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
                                <CommonForm.Item name="idType">
                                    <FloatingLabel
                                        type="radio"
                                        size="large"
                                        optionType="default"
                                        options={ID_TYPE_OPTIONS}
                                        label={t("back.event.participant.form.idType")}
                                        required
                                        disabled={isViewMode}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="idNo"
                                    // Digits only for an ID card; a passport is upper-case letters and digits.
                                    normalize={(v) => idType === 'passport'
                                        ? (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
                                        : (v || '').replace(/\D/g, '')}
                                    rules={[
                                        {
                                            required: true,
                                            message: t(idType === 'passport' ? "required.passport" : "required.idNo"),
                                        },
                                        {
                                            validator: (_, value) => {
                                                if (!value) return Promise.resolve();
                                                if (idType === 'passport') {
                                                    // ICAO 9303: at most 9 characters (a Thai passport is 2 letters + 7 digits).
                                                    return /^[A-Z0-9]{6,9}$/.test(value)
                                                        ? Promise.resolve()
                                                        : Promise.reject(t("validation.passport"));
                                                }
                                                if (!isThaiIdNo(value)) {
                                                    return Promise.reject(t("validation.idNoDigits"));
                                                }
                                                return validateIDCard(value)
                                                    ? Promise.resolve()
                                                    : Promise.reject(t("validation.idNo"));
                                            },
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        maxLength={idType === 'passport' ? 9 : 13}
                                        size="large"
                                        label={t(idType === 'passport'
                                            ? "back.event.participant.form.passportNo"
                                            : "back.event.participant.form.idCardNo")}
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
                                <PhoneInput form={form} variant="floating" codeName="phoneCountryCode" numberName="phone"
                                    label={t("back.event.participant.form.phone")} readOnly={isViewMode} />
                            </Col>
                        </Row>

                        {/* ── Address ── */}
                        <SectionHeader
                            icon={<HomeOutlined />}
                            title={t("back.event.participant.form.sectionAddress")}
                        />
                        <Row gutter={[16, 16]}>
                            <Col xs={24}>
                                <CommonForm.Item name="address">
                                    <FloatingLabel label={t("back.event.participant.form.address")} readOnly={isViewMode} />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <CommonForm.Item name="district">
                                    <FloatingLabel label={t("back.event.participant.form.district")} readOnly={isViewMode} />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={6}>
                                <CommonForm.Item name="amphoe">
                                    <FloatingLabel label={t("back.event.participant.form.amphoe")} readOnly={isViewMode} />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={6}>
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
                            <Col xs={24} md={6}>
                                <CommonForm.Item name="zipcode">
                                    <FloatingLabel label={t("back.event.participant.form.zipcode")} maxLength={5} readOnly={isViewMode} />
                                </CommonForm.Item>
                            </Col>
                        </Row>

                        {deliveryByPost && (
                            <>
                                <SectionHeader
                                    icon={<CarOutlined />}
                                    title={t("back.event.participant.form.sectionShipping")}
                                />
                                <Row gutter={[16, 16]}>
                                    <Col xs={24}>
                                        <CommonForm.Item name="shippingAddress">
                                            <FloatingLabel label={t("back.event.participant.form.shippingAddress")} readOnly={isViewMode} />
                                        </CommonForm.Item>
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <CommonForm.Item name="shippingDistrict">
                                            <FloatingLabel label={t("back.event.participant.form.shippingDistrict")} readOnly={isViewMode} />
                                        </CommonForm.Item>
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <CommonForm.Item name="shippingAmphoe">
                                            <FloatingLabel label={t("back.event.participant.form.shippingAmphoe")} readOnly={isViewMode} />
                                        </CommonForm.Item>
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <CommonForm.Item name="shippingProvince">
                                            <FloatingLabel label={t("back.event.participant.form.shippingProvince")} readOnly={isViewMode} />
                                        </CommonForm.Item>
                                    </Col>
                                    <Col xs={24} md={6}>
                                        <CommonForm.Item name="shippingZipcode">
                                            <FloatingLabel label={t("back.event.participant.form.shippingZipcode")} maxLength={5} readOnly={isViewMode} />
                                        </CommonForm.Item>
                                    </Col>
                                </Row>
                            </>
                        )}

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
                                <PhoneInput form={form} variant="floating" codeName="emergencyPhoneCountryCode" numberName="emergencyPhone"
                                    label={t("back.event.participant.form.emergencyPhone")} readOnly={isViewMode} />
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

                                        /* ── TEXT / RATING / IMAGE ── */
                                        if (field.type === 'TEXT') {
                                            return (
                                                <QuestionCard key={field.id} index={index} label={questionLabel} required={field.required}>
                                                    <CommonForm.Item name={['selectionAnswers', field.id]} className="!mb-0" rules={rules}>
                                                        <FloatingLabel type="textarea" rows={2} label={questionLabel} readOnly={isViewMode} />
                                                    </CommonForm.Item>
                                                </QuestionCard>
                                            );
                                        }
                                        if (field.type === 'RATING') {
                                            return (
                                                <QuestionCard key={field.id} index={index} label={questionLabel} required={field.required}>
                                                    <CommonForm.Item name={['selectionAnswers', field.id]} className="!mb-0" rules={rules}>
                                                        <Rate disabled={isViewMode} />
                                                    </CommonForm.Item>
                                                </QuestionCard>
                                            );
                                        }
                                        if (field.type === 'IMAGE') {
                                            const url = form.getFieldValue(['selectionAnswers', field.id]);
                                            return (
                                                <QuestionCard key={field.id} index={index} label={questionLabel} required={field.required}>
                                                    <CommonForm.Item name={['selectionAnswers', field.id]} hidden noStyle>
                                                        <input type="hidden" />
                                                    </CommonForm.Item>
                                                    {url ? (
                                                        <div className="flex items-center gap-3">
                                                            <AntImage src={url} width={96} height={96} className="rounded-lg object-cover" />
                                                            <a href={url} target="_blank" rel="noreferrer" className="text-xs">{t("back.event.participant.form.openImage")}</a>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">{t("back.event.participant.form.emptyValue")}</span>
                                                    )}
                                                </QuestionCard>
                                            );
                                        }

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

                        {/* ── Add-ons bought for this runner (plus whole-order ones on the first runner) ── */}
                        {participantData?.addOns?.length > 0 && (
                            <>
                                <SectionHeader
                                    icon={<GiftOutlined />}
                                    title={t("back.event.participant.form.sectionAddOns")}
                                />
                                <AddOnList items={participantData.addOns} showApplicant={false} />
                            </>
                        )}
                    </CommonForm>
                </Spin>
            </Modal>
        </div>
    )
}

export default Participant


