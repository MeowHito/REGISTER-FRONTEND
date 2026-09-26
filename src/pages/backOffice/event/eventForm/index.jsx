import { useEffect, useState } from 'react'
import { Col, Input, notification, Row, Spin, Switch } from 'antd';
import CommonForm from "components/commonForm";
import { AlertError, AlertConfirm } from 'components/alert';
import PageHeader from 'components/pageHeader';
import SectionCard from 'components/sectionCard';
import { hexToRgba } from 'utils/dashboard';
import StickyActionBar from 'components/stickyActionBar';
import _ from "lodash";
import useUploadFileHook from 'hooks/useUploadFileHook';
import backOfficeServices from "services/backoffice.services";
import { errorToMessage } from 'hooks/functions/errorToMessage';
import dayjs from 'dayjs';
import { handleQueryStatus } from 'utils';
import { useTranslation } from 'react-i18next';
import PaymentTypes from '../paymentTypes';
import EventTypes from '../eventTypes';
import FloatingLabel from 'components/floatingLabel';
import EventDetails from '../eventDetails';
import EventConditions from '../eventConditions';
import ImageUpload from 'components/imageUpload';
import { checkAndUploadImg, convertStorageToHtml, getImageFileToUpload, getPublicUrl, UploadFailedError } from 'utils/fileUtils';
import { CalendarOutlined, SaveOutlined, WarningOutlined } from '@ant-design/icons';
import { eventTypeOption } from 'constants/options/eventTypeOption';
import ShirtTypes from '../shirtTypes';
import { toStartOfDayISO } from 'utils/format';
import { v4 as uuidv4 } from 'uuid';
import useCountryStateHook from 'hooks/useCountryStateHook';
import EventSelections from '../eventSelections';
import EventAddOns from '../eventAddOns';
import useMe from 'hooks/useMe';

// Each section's own colour: its tab in the nav and a faint tint on its card.
// `text` is a darker shade of `color` so the tab label stays readable on the tint.
const SECTION_TONES = {
    "ef-general": { color: "#0071e3", text: "#0058b0" },
    "ef-theme": { color: "#af52de", text: "#8a3bb3" },
    "ef-settings": { color: "#ff3b30", text: "#c9251c" },
    "ef-description": { color: "#ff9f0a", text: "#a65c00" },
    "ef-race": { color: "#34c759", text: "#1f7a37" },
    "ef-questions": { color: "#30b0c7", text: "#16778a" },
    "ef-shirts": { color: "#5856d6", text: "#3d3bb0" },
    "ef-extra": { color: "#a2845e", text: "#7a5f3d" },
};

const EventForm = ({ isEditable, eventId, refetch, mode, setMode }) => {
    const { t } = useTranslation();
    const [form] = CommonForm.useForm();
    const [initialValues, setInitialValues] = useState({});
    const [optionOrganizer, setOptionOrganizer] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const prefix = "event";
    const startRegistrationDate = CommonForm.useWatch("startRegistrationDate", form);
    const endRegistrationDate = CommonForm.useWatch("endRegistrationDate", form);
    const link = CommonForm.useWatch("link", form);
    const eventName = CommonForm.useWatch("name", form);
    const testMode = CommonForm.useWatch("testMode", form);
    const primaryColor = CommonForm.useWatch("eventPrimaryColor", form);
    const secondaryColor = CommonForm.useWatch("eventSecondaryColor", form);
    const fontColor = CommonForm.useWatch("eventFontColor", form);
    const [dirty, setDirty] = useState(false);

    const {
        data: me
    } = useMe({ retry: 0 });
    const roleUser = me?.role?.roleType;

    const {
        isLoadingProvince,
        provinceOption,
    } = useCountryStateHook();

    const logohooks = useUploadFileHook();
    const picturehooks = useUploadFileHook();

    const {
        fileList: logoFileList,
        setFileList: setLogoFileList
    } = logohooks

    const {
        fileList: pictureFileList,
        setFileList: setPictureFileList
    } = picturehooks

    const { data: organizers, isFetching: isLoadingOrganizer, ...otherOrganizers } = backOfficeServices.useQueryGetOrganizerActive();

    const { data: eventData, isFetching: isLoadingEvent } = backOfficeServices.useQueryGetEventById({ id: eventId });

    const { mutateAsync: createEvent } = backOfficeServices.useMutationCreateEvent();

    const { mutateAsync: updateEvent } = backOfficeServices.useMutationUpdateEvent();

    useEffect(() => {
        handleQueryStatus(otherOrganizers, () => {
            let options = organizers.map((n) => {
                return { value: n.id, label: `${n?.firstName || ''} ${n?.lastName || ''}`.trim() || n?.email };
            });

            setOptionOrganizer(options);
        })
    }, [otherOrganizers.fetchStatus])

    const onFinish = (values) => {
        AlertConfirm({
            onOk: async () => {
                try {
                    setSubmitting(true);
                    const fileLogoName = await getImageFileToUpload({
                        fileList: logoFileList,
                        prefix,
                        oldKey: eventData?.logoUrl,
                        isPublic: true,
                        strict: true,
                    });
                    const filePictureName = await getImageFileToUpload({
                        fileList: pictureFileList,
                        prefix,
                        oldKey: eventData?.pictureUrl,
                        isPublic: true,
                        strict: true,
                    });

                    const payload = await cleanFormValues({
                        ...values,
                        logoUrl: fileLogoName,
                        pictureUrl: filePictureName,
                        prefixPath: fileLogoName || filePictureName ? prefix : null,
                    });

                    if (mode === "edit" && values.id) {
                        await updateEvent(payload)
                    } else {
                        await createEvent(payload);
                    }

                    setDirty(false);
                    refetch();
                    notification.success({
                        message: t("back.shell.savedTitle"),
                        description: t("back.shell.savedDesc"),
                        placement: "topRight",
                    });
                } catch (err) {
                    // The upload already showed its own alert; nothing was saved.
                    if (err instanceof UploadFailedError) return;
                    const response = err?.response;
                    const data = response?.data;

                    if (data?.message) {
                        const itemName = data?.data?.itemName;
                        AlertError({
                            text: itemName ? `${data.message} (${itemName})` : data.message
                        });
                    } else {
                        AlertError({ text: errorToMessage(err) });
                    }
                } finally {
                    setSubmitting(false);
                }
            }
        });
    };

    const cleanFormValues = async (values) => {
        const { logoFile: _logoFile, pictureFile: _pictureFile, ...rest } = values;
        return {
            ...rest,

            eventDate: toStartOfDayISO(values.eventDate),
            startRegistrationDate: values.startRegistrationDate?.toISOString(),
            endRegistrationDate: values.endRegistrationDate?.toISOString(),

            description: await checkAndUploadImg(values.description, prefix, { isPublic: true }),
            paymentTypes: (values.paymentTypes || []).map(pt => ({
                ...pt,
                endDate: pt.endDate?.toISOString() || null
            })),

            eventConditions: values.eventConditions || [],
            eventDetails: await Promise.all((values.eventDetails || []).map(async (d, index) => ({
                ...d,
                detail: await checkAndUploadImg(d.detail, prefix, { isPublic: true }),
                position: index,
            }))),
            shirtTypes: (values.shirtTypes || []).map(st => ({
                ...st,
                shirtSizes: st.shirtSizes || []
            })),
            isDraft: eventData?.isDraft || false,

            addOns: await Promise.all((values.addOns || []).map(async (a, index) => ({
                ...a,
                description: await checkAndUploadImg(a.description, prefix, { isPublic: true }),
                perApplicant: !!a.perApplicant,
                active: a.active !== false,
                noteRequired: !!a.noteRequired,
                // a per-applicant add-on is one-per-runner, so a per-order cap is meaningless
                maxPerOrder: a.perApplicant ? null : (a.maxPerOrder ?? null),
                position: index,
            }))),

            selectionFields: (values.selectionFields || []).map((field) => ({
                ...field,
                options: (field.options || []).map((opt, optIndex) => ({
                    ...opt,
                    position: optIndex,
                })),
            })),

            eventTypes: (values.eventTypes || []).map((et) => {
                const maleAgeGroups = (et.maleAgeGroups || []).map((ag, index) => ({
                    ...ag,
                    position: index,
                }));

                const femaleAgeGroups = (et.femaleAgeGroups || []).map((ag, index) => ({
                    ...ag,
                    position: index,
                }));

                const mergedAgeGroups = [...maleAgeGroups, ...femaleAgeGroups];

                return {
                    ...et,
                    isTeam: et?.isTeam ?? false,
                    eventDate: toStartOfDayISO(et.eventDate),
                    pricing: (et.pricing || [])
                        .filter(p => p.selected)
                        .map(({ selected: _selected, ...rest }) => rest),
                    ageGroups: mergedAgeGroups,

                    selectionFields: (et.selectionFields || []).map((field) => ({
                        ...field,
                        options: (field.options || []).map((opt, optIndex) => ({
                            ...opt,
                            position: optIndex,
                        })),
                    })),

                    maleAgeGroups: undefined,
                    femaleAgeGroups: undefined,
                    maleMinAge: undefined,
                    maleMaxAge: undefined,
                    maleAgeRange: undefined,
                    femaleMinAge: undefined,
                    femaleMaxAge: undefined,
                    femaleAgeRange: undefined,
                    isMaleGroup: undefined,
                    isFemaleGroup: undefined
                };
            })
        };
    };

    useEffect(() => {
        const loadAndPrepare = async () => {
            if (eventData && mode === "edit") {
                const convertedEventDetails = await Promise.all(
                    (eventData.eventDetails || [])
                        .sort((a, b) => a.position - b.position)
                        .map(async (d) => ({
                            ...d,
                            detail: await convertStorageToHtml(d.detail, prefix, getPublicUrl),
                        }))
                );

                const convertedAddOns = await Promise.all(
                    (eventData.addOns || [])
                        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                        .map(async (a) => ({
                            ...a,
                            perApplicant: !!a.perApplicant,
                            active: a.active !== false,
                            noteRequired: !!a.noteRequired,
                            description: await convertStorageToHtml(a.description, prefix, getPublicUrl),
                        }))
                );

                const cleanedData = {
                    ...eventData,
                    showChecklist: eventData?.showChecklist ?? false,
                    testMode: eventData?.testMode ?? false,
                    eventDate: dayjs(eventData.eventDate),
                    description: await convertStorageToHtml(eventData.description, prefix, getPublicUrl),
                    startRegistrationDate: eventData.startRegistrationDate ? dayjs(eventData.startRegistrationDate) : null,
                    endRegistrationDate: eventData.endRegistrationDate ? dayjs(eventData.endRegistrationDate) : null,
                    paymentTypes: eventData.paymentTypes?.map(p => ({
                        ...p,
                        endDate: dayjs(p.endDate),
                    })) || [],
                    eventDetails: convertedEventDetails,
                    addOns: convertedAddOns,
                    shirtTypes: (eventData.shirtTypes || []).map(st => ({
                        ...st,
                        shirtSizes: st.shirtSizes || [],
                    })),
                    eventTypes: (eventData.eventTypes || []).map(et => {
                        const maleAgeGroups = (et.ageGroups || [])
                            .filter(a => a.gender === "male")
                            .sort((a, b) => a.position - b.position);

                        const femaleAgeGroups = (et.ageGroups || [])
                            .filter(a => a.gender === "female")
                            .sort((a, b) => a.position - b.position);

                        return {
                            ...et,
                            isTeam: et?.isTeam ?? false,
                            eventDate: dayjs(et.eventDate),
                            maleAgeGroups,
                            femaleAgeGroups,
                            isMaleGroup: maleAgeGroups.length > 0,
                            isFemaleGroup: femaleAgeGroups.length > 0,
                            pricing: (eventData.paymentTypes || []).map(pt => {
                                const matchedPricing = (et.pricing || []).find(p => p.paymentTypeId === pt.id);
                                return {
                                    paymentTypeId: pt.id,
                                    price: matchedPricing?.price ?? null,
                                    quota: matchedPricing?.quota ?? null,
                                    selected: !!matchedPricing,
                                    id: matchedPricing?.id ?? null,
                                };
                            }),
                        };
                    }) || [],
                };
                setInitialValues(cleanedData);
                form.setFieldsValue(cleanedData);
            } else {
                form.resetFields();
                setLogoFileList([]);
                setPictureFileList([]);
            }

            if (mode === "create") {
                form.setFieldsValue({
                    generalInfoTitle: t("front.eventDetail.general"),
                    eventTypeTitle: t("front.eventDetail.eventType"),
                    showChecklist: false,
                    testMode: false,
                    eventConditions: [
                        { id: uuidv4(), description: "ข้าพเจ้าได้ตรวจสอบข้อมูลความถูกต้องของการสมัครเรียบร้อย" },
                        { id: uuidv4(), description: "ข้าพเจ้ายอมรับเงื่อนไขการสมัครของผู้จัดงาน" },
                        { id: uuidv4(), description: "ข้าพเจ้ายอมรับกติกาและเงื่อนไขการแข่งขัน" },
                    ]
                });
            }
        };

        loadAndPrepare();
    }, [eventData, mode]);

    const handleBack = () => {
        const currentValues = form.getFieldsValue(true);
        const hasChanges = !_.isEqual(currentValues, initialValues) ||
            logoFileList.some(e => !e.isPreview) || pictureFileList.some(e => !e.isPreview);

        if (hasChanges) {
            AlertConfirm({
                title: t("general.cancelEditConfirmTitle"),
                text: t("general.cancelEditConfirmText"),
                onOk: () => {
                    setLogoFileList([]);
                    setPictureFileList([]);
                    form.resetFields();
                    setMode(null);
                },
            });
        } else {
            setMode(null);
        }
    };

    const sections = [
        { id: "ef-general", label: t("back.event.form.section.general") },
        { id: "ef-theme", label: t("back.event.form.section.theme") },
        roleUser === "admin" && { id: "ef-settings", label: t("back.event.form.section.settings") },
        { id: "ef-description", label: t("back.event.form.section.description") },
        { id: "ef-race", label: t("back.event.form.section.race") },
        { id: "ef-questions", label: t("back.event.form.section.questions") },
        { id: "ef-shirts", label: t("back.event.form.section.shirts") },
        { id: "ef-extra", label: t("back.event.form.section.extra") },
    ].filter(Boolean);
    const [activeSection, setActiveSection] = useActiveSection(sections);
    // Props that give a section card its colour and mark it while it is in view.
    const tone = (id) => ({ id, accent: SECTION_TONES[id].color, active: activeSection === id });

    const origin = `${globalThis.location.protocol}//${globalThis.location.host}`;
    const isDraft = mode !== "edit" || !!eventData?.isDraft;
    const gutter = { xs: 8, md: 16 };

    return (
        <>
            <PageHeader
                onBack={handleBack}
                backLabel={t("back.event.form.backToList")}
                title={mode === "edit" ? t("back.event.form.editTitle") : t("back.event.form.createTitle")}
                tag={
                    <span className={`inline-flex items-center h-6 px-2.5 rounded-full text-xs font-semibold ${isDraft ? "bg-[rgba(0,0,0,0.06)] text-[#424245]" : "bg-[rgba(52,199,89,0.12)] text-[#1d7c34]"}`}>
                        {isDraft ? t("back.event.form.draftTag") : t("back.event.form.publishedTag")}
                    </span>
                }
                subtitle={t("back.event.form.subtitle")}
            />

            <SectionNav sections={sections} active={activeSection} onSelect={setActiveSection} />

            <Spin spinning={isLoadingEvent}>
                <CommonForm
                    form={form}
                    name="event-form"
                    layout="vertical"
                    onFinish={onFinish}
                    onValuesChange={() => setDirty(true)}
                    autoComplete="off"
                >
                    <CommonForm.Item name="id" noStyle>
                        <Input hidden />
                    </CommonForm.Item>

                    <div className="grid gap-6">
                        <SectionCard {...tone("ef-general")} title={t("back.event.form.section.general")} description={t("back.event.form.section.generalDesc")}>
                            <CommonForm.Item
                                name="generalInfoTitle"
                                rules={[{ required: true, message: t("required.generalInfoTitle") }]}
                            >
                                <FloatingLabel size="large" label={t("back.event.form.generalInfoTitle")} required readOnly={!isEditable} />
                            </CommonForm.Item>
                            <CommonForm.Item name="name" rules={[{ required: true, message: t("required.event") }]}>
                                <FloatingLabel size="large" label={t("back.event.form.name")} required readOnly={!isEditable} />
                            </CommonForm.Item>
                            <Row gutter={gutter}>
                                <Col xs={24} md={12}>
                                    <CommonForm.Item name="type" rules={[{ required: true, message: t("required.eventType") }]}>
                                        <FloatingLabel
                                            type="select"
                                            label={t("back.event.form.selectEventType")}
                                            required
                                            size="large"
                                            disabled={!isEditable}
                                            options={eventTypeOption}
                                            filterOption={(input, option) =>
                                                option.label.toLowerCase().includes(input.toLowerCase())
                                            }
                                        />
                                    </CommonForm.Item>
                                </Col>
                                {roleUser === "admin" && (
                                    <Col xs={24} md={12}>
                                        <CommonForm.Item name="organizerId" rules={[{ required: true, message: t("organizer") }]}>
                                            <FloatingLabel
                                                type="select"
                                                label={t("back.event.form.selectOrganizer")}
                                                required
                                                showSearch
                                                size="large"
                                                disabled={isLoadingOrganizer}
                                                options={optionOrganizer}
                                                filterOption={(input, option) =>
                                                    option.label.toLowerCase().includes(input.toLowerCase())
                                                }
                                            />
                                        </CommonForm.Item>
                                    </Col>
                                )}
                            </Row>
                            <Row gutter={gutter}>
                                <Col xs={24} md={12}>
                                    <CommonForm.Item name="organizerName" rules={[{ required: true, message: t("required.organizerName") }]}>
                                        <FloatingLabel size="large" label={t("back.event.form.organizerName")} required readOnly={!isEditable} />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={7}>
                                    <CommonForm.Item name="location">
                                        <FloatingLabel size="large" label={t("back.event.form.location")} readOnly={!isEditable} />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={5}>
                                    <CommonForm.Item name="provinceId" rules={[{ required: true, message: t("required.province") }]}>
                                        <FloatingLabel
                                            type="select"
                                            label={t("back.event.form.selectProvince")}
                                            required
                                            showSearch
                                            size="large"
                                            disabled={isLoadingProvince}
                                            options={provinceOption}
                                            filterOption={(input, option) => {
                                                const str = option.filterLabel || (typeof option.label === 'string' ? option.label : '');
                                                return str.toLowerCase().includes(input.toLowerCase());
                                            }}
                                        />
                                    </CommonForm.Item>
                                </Col>
                            </Row>

                            <div className="bo-inset p-4 md:p-5 mb-6">
                                <p className="m-0 mb-6 flex items-center gap-2 text-sm font-semibold text-[#1d1d1f]">
                                    <CalendarOutlined className="text-[#0071e3]" />
                                    {t("back.event.form.section.dates")}
                                </p>
                                <Row gutter={gutter}>
                                    <Col xs={24} md={8}>
                                        <CommonForm.Item
                                            name="startRegistrationDate"
                                            rules={[{ required: true, message: t("required.startRegistrationDate") }]}
                                        >
                                            <FloatingLabel
                                                type="date"
                                                showTime
                                                required
                                                label={t("back.event.form.startRegistrationDate")}
                                                className="w-full"
                                                disabled={!isEditable}
                                                minDate={dayjs(new Date())}
                                            />
                                        </CommonForm.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <CommonForm.Item
                                            name="endRegistrationDate"
                                            dependencies={['startRegistrationDate']}
                                            rules={[
                                                { required: true, message: t("required.endRegistrationDate") },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const startDate = getFieldValue('startRegistrationDate');
                                                        if (!value || !startDate) {
                                                            return Promise.resolve();
                                                        }
                                                        if (dayjs(value).isAfter(dayjs(startDate))) {
                                                            return Promise.resolve();
                                                        }
                                                        return Promise.reject(new Error(t("validation.endDateAfterStart")));
                                                    },
                                                }),
                                            ]}
                                        >
                                            <FloatingLabel
                                                type="date"
                                                showTime
                                                required
                                                label={t("back.event.form.endRegistrationDate")}
                                                className="w-full"
                                                disabled={!isEditable}
                                                minDate={startRegistrationDate ? dayjs(startRegistrationDate) : dayjs(new Date())}
                                            />
                                        </CommonForm.Item>
                                    </Col>
                                    <Col xs={24} md={8}>
                                        <CommonForm.Item
                                            name="eventDate"
                                            dependencies={['endRegistrationDate']}
                                            rules={[
                                                { required: true, message: t("required.eventDate") },
                                                ({ getFieldValue }) => ({
                                                    validator(_, value) {
                                                        const endDate = getFieldValue('endRegistrationDate');
                                                        if (!value || !endDate) {
                                                            return Promise.resolve();
                                                        }
                                                        if (dayjs(value).isAfter(dayjs(endDate))) {
                                                            return Promise.resolve();
                                                        }
                                                        return Promise.reject(new Error(t("validation.eventDateAfterEndRegistration")));
                                                    },
                                                }),
                                            ]}
                                        >
                                            <FloatingLabel
                                                type="date"
                                                required
                                                label={t("back.event.form.eventDate")}
                                                className="w-full"
                                                disabled={!isEditable}
                                                minDate={endRegistrationDate ? dayjs(endRegistrationDate).add(1, 'day') : dayjs(new Date()).add(1, 'day')}
                                            />
                                        </CommonForm.Item>
                                    </Col>
                                </Row>
                            </div>

                            <Row gutter={gutter}>
                                <Col xs={24} md={12}>
                                    <CommonForm.Item
                                        name="link"
                                        extra={
                                            <span className="text-xs text-[#6e6e73]">
                                                {t("back.event.form.linkPreview")}:{" "}
                                                <a href={`${origin}/eventDetail/${link || eventData?.id || ""}`} target="_blank" rel="noopener noreferrer">
                                                    {`${origin}/eventDetail/${link || eventData?.id || "…"}`}
                                                </a>
                                            </span>
                                        }
                                    >
                                        <FloatingLabel size="large" label={t("back.event.form.link")} readOnly={!isEditable} />
                                    </CommonForm.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <CommonForm.Item name="shippingFee" extra={<span className="text-xs text-[#6e6e73]">{t("back.event.form.shippingFeeHint")}</span>}>
                                        <FloatingLabel
                                            type="number"
                                            size="large"
                                            className="w-full"
                                            label={t("back.event.form.shippingFee")}
                                            addonAfter={t("general.unitBaht")}
                                        />
                                    </CommonForm.Item>
                                </Col>
                            </Row>
                        </SectionCard>

                        <SectionCard {...tone("ef-theme")} title={t("back.event.form.section.theme")} description={t("back.event.form.section.themeDesc")}>
                            <div className="flex flex-wrap gap-4 mb-2">
                                <CommonForm.Item name="logoFile" rules={[{ required: true, message: t("required.logo") }]}>
                                    <ImageUpload
                                        label={t("back.event.form.logo")}
                                        prefix={prefix}
                                        filename={eventData?.logoUrl}
                                        hooks={logohooks}
                                        uploadText={t("general.uploadImg")}
                                        alt={t("back.event.form.logoAlt")}
                                        disabled={!isEditable}
                                        isEditable={isEditable}
                                    />
                                </CommonForm.Item>
                                <CommonForm.Item name="pictureFile" rules={[{ required: true, message: t("required.coverImg") }]}>
                                    <ImageUpload
                                        label={t("back.event.form.coverImg")}
                                        prefix={prefix}
                                        filename={eventData?.pictureUrl}
                                        hooks={picturehooks}
                                        uploadText={t("general.uploadImg")}
                                        alt={t("back.event.form.coverImgAlt")}
                                        disabled={!isEditable}
                                        isEditable={isEditable}
                                    />
                                </CommonForm.Item>
                            </div>

                            <div className="border-t border-[#e5e5ea] pt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                                <div>
                                    <p className="m-0 mb-6 text-sm font-semibold text-[#1d1d1f]">{t("back.event.form.section.colors")}</p>
                                    <Row gutter={gutter}>
                                        <Col xs={24} md={8}>
                                            <CommonForm.Item name="eventPrimaryColor">
                                                <FloatingLabel type="color" label={t("back.event.form.eventPrimaryColor")} />
                                            </CommonForm.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <CommonForm.Item name="eventSecondaryColor">
                                                <FloatingLabel type="color" label={t("back.event.form.eventSecondaryColor")} />
                                            </CommonForm.Item>
                                        </Col>
                                        <Col xs={24} md={8}>
                                            <CommonForm.Item name="eventFontColor">
                                                <FloatingLabel type="color" label={t("back.event.form.eventFontColor")} />
                                            </CommonForm.Item>
                                        </Col>
                                    </Row>
                                </div>
                                <ThemePreview
                                    t={t}
                                    name={eventName}
                                    primary={toHex(primaryColor)}
                                    secondary={toHex(secondaryColor)}
                                    font={toHex(fontColor)}
                                />
                            </div>
                        </SectionCard>

                        {roleUser === "admin" && (
                            <SectionCard {...tone("ef-settings")} title={t("back.event.form.section.settings")} description={t("back.event.form.section.settingsDesc")} bodyClassName="!py-2">
                                <div className="flex items-center justify-between gap-4 py-4 border-b border-[#e5e5ea]">
                                    <div>
                                        <p className="m-0 text-sm font-semibold text-[#1d1d1f]">{t("back.event.form.showChecklist")}</p>
                                        <p className="m-0 mt-0.5 text-xs text-[#6e6e73]">{t("back.event.form.showChecklistHint")}</p>
                                    </div>
                                    <CommonForm.Item name="showChecklist" valuePropName="checked" className="!mb-0">
                                        <Switch disabled={!isEditable} />
                                    </CommonForm.Item>
                                </div>
                                <div className="flex items-center justify-between gap-4 py-4">
                                    <div>
                                        <p className="m-0 text-sm font-semibold text-[#1d1d1f] flex items-center gap-2">
                                            {t("back.event.form.testMode")}
                                            <span className="inline-flex items-center h-5 px-2 rounded-full bg-[rgba(255,59,48,0.1)] text-[#d70015] text-[10px] font-bold tracking-wide">SANDBOX</span>
                                        </p>
                                        <p className="m-0 mt-0.5 text-xs text-[#6e6e73]">{t("back.event.form.testModeDesc")}</p>
                                    </div>
                                    <CommonForm.Item name="testMode" valuePropName="checked" className="!mb-0">
                                        <Switch disabled={!isEditable} className={testMode ? "!bg-[#ff3b30]" : ""} />
                                    </CommonForm.Item>
                                </div>
                                {testMode && (
                                    <div className="mb-4 rounded-xl border border-[#ffc0bd] bg-[#fff2f2] px-4 py-3 flex gap-3">
                                        <WarningOutlined className="text-[#d70015] mt-0.5" />
                                        <div>
                                            <p className="m-0 text-sm font-semibold text-[#d70015]">{t("back.event.form.testModeWarnTitle")}</p>
                                            <p className="m-0 mt-0.5 text-xs text-[#86181d]">{t("back.event.form.testModeHint")}</p>
                                        </div>
                                    </div>
                                )}
                            </SectionCard>
                        )}

                        <SectionCard {...tone("ef-description")} title={t("back.event.form.section.description")} description={t("back.event.form.section.descriptionDesc")}>
                            <CommonForm.Item name="description" rules={[{ required: true, message: t("required.description") }]}>
                                <FloatingLabel type="tiptap" size="large" label={t("back.event.form.description")} required readOnly={!isEditable} />
                            </CommonForm.Item>
                        </SectionCard>

                        <SectionCard {...tone("ef-race")} title={t("back.event.form.section.race")} description={t("back.event.form.section.raceDesc")}>
                            <Title>{t("back.event.form.paymentTypes")}</Title>
                            <PaymentTypes form={form} />
                            <div className="border-t border-[#e5e5ea] my-6" />
                            <CommonForm.Item name="eventTypeTitle" rules={[{ required: true, message: t("required.eventTypeTitle") }]}>
                                <FloatingLabel size="large" label={t("back.event.form.eventTypeTitle")} required readOnly={!isEditable} />
                            </CommonForm.Item>
                            <EventTypes form={form} />
                        </SectionCard>

                        <SectionCard {...tone("ef-questions")} title={t("back.event.form.section.questions")} description={t("back.event.form.section.questionsDesc")}>
                            <Title>{t("back.event.form.selectionFields")}</Title>
                            <EventSelections form={form} />
                            <div className="border-t border-[#e5e5ea] my-6" />
                            <Title>{t("back.event.form.conditions")}</Title>
                            <EventConditions form={form} />
                        </SectionCard>

                        <SectionCard {...tone("ef-shirts")} title={t("back.event.form.section.shirts")} description={t("back.event.form.section.shirtsDesc")}>
                            <Title>{t("back.event.form.shirtTypeAndSize")}</Title>
                            <ShirtTypes form={form} />
                            <div className="border-t border-[#e5e5ea] my-6" />
                            <Title>{t("back.event.form.addOns")}</Title>
                            <div className="rounded-xl bg-[#f0f6ff] border border-[#cfe2fb] text-[13px] text-[#0b4f99] px-4 py-3 mb-4">
                                {t("back.event.form.addOnsHelp")}
                            </div>
                            <EventAddOns form={form} isEditable={isEditable} />
                        </SectionCard>

                        <SectionCard {...tone("ef-extra")} title={t("back.event.form.section.extra")} description={t("back.event.form.section.extraDesc")}>
                            <EventDetails form={form} />
                        </SectionCard>
                    </div>

                    {isEditable && (
                        <StickyActionBar
                            dirty={dirty}
                            onCancel={handleBack}
                            saving={submitting}
                            saveHtmlType="submit"
                            saveIcon={<SaveOutlined />}
                            saveText={t("general.buttonSave")}
                        />
                    )}
                </CommonForm>
            </Spin>
        </>
    )
}

/** Which section is in view, following the scroll position. */
const useActiveSection = (sections) => {
    const [active, setActive] = useState(sections[0]?.id);
    const sectionIds = sections.map((s) => s.id).join();

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActive(visible[0].target.id);
            },
            { rootMargin: "-140px 0px -55% 0px" }
        );
        sectionIds.split(",").forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [sectionIds]);

    return [active, setActive];
};

/** Sticky pill nav, one colour per section, that scrolls to each section card. */
const SectionNav = ({ sections, active, onSelect }) => (
    <div className="sticky top-16 z-20 -mx-1 px-1 py-2 mb-4 bg-[#f5f5f7]/90 backdrop-blur">
        <div className="bo-card flex gap-1.5 p-1.5 overflow-x-auto">
            {sections.map(({ id, label }) => {
                const { color, text } = SECTION_TONES[id];
                const selected = active === id;
                return (
                    <button
                        key={id}
                        type="button"
                        onClick={() => {
                            onSelect(id);
                            document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }}
                        className={`shrink-0 inline-flex items-center gap-2 px-3.5 h-9 rounded-lg text-[13px] cursor-pointer transition-all ${selected ? "font-semibold text-white shadow-sm" : "font-medium hover:brightness-95"}`}
                        style={selected
                            ? { backgroundColor: color }
                            : { backgroundColor: hexToRgba(color, 0.1), color: text }}
                    >
                        <span
                            aria-hidden
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: selected ? "#ffffff" : color }}
                        />
                        {label}
                    </button>
                );
            })}
        </div>
    </div>
);

const toHex = (c) => (typeof c === "string" ? c : c?.toHexString?.() || null);

/** How the event's colours look on the public registration card. */
const ThemePreview = ({ t, name, primary, secondary, font }) => (
    <div className="bo-inset p-4">
        <p className="m-0 mb-3 text-xs font-semibold text-[#6e6e73]">{t("back.event.form.themePreview")}</p>
        <div className="bo-card p-4">
            <span
                className="inline-flex items-center h-5 px-2 rounded text-[10px] font-bold uppercase tracking-wide"
                style={{ background: secondary || "#38bdf8", color: font || "#ffffff" }}
            >
                {t("back.event.form.themePreviewTag")}
            </span>
            <p className="m-0 mt-2 text-sm font-bold text-[#1d1d1f] truncate">{name || t("back.event.form.name")}</p>
            <div
                className="mt-3 h-10 rounded-lg flex items-center justify-center text-sm font-semibold"
                style={{ background: primary || "#0071e3", color: font || "#ffffff" }}
            >
                {t("back.event.form.themePreviewButton")} →
            </div>
        </div>
    </div>
);

const Title = ({ className, children }) => <div className={`text-lg font-bold mb-3 ${className || ""}`}>{children}</div>

export default EventForm

