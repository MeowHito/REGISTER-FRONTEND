import { useEffect, useState } from 'react'
import { Button, Col, Input, Row, Spin, Switch } from 'antd';
import CommonForm from "components/commonForm";
import { AlertSuccess, AlertError, AlertConfirm } from 'components/alert';
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
import { checkAndUploadImg, convertStorageToHtml, getImageFileToUpload, getPublicUrl } from 'utils/fileUtils';
import { LeftOutlined } from '@ant-design/icons';
import { eventTypeOption } from 'constants/options/eventTypeOption';
import ShirtTypes from '../shirtTypes';
import { toStartOfDayISO } from 'utils/format';
import { v4 as uuidv4 } from 'uuid';
import useCountryStateHook from 'hooks/useCountryStateHook';
import EventSelections from '../eventSelections';
import useMe from 'hooks/useMe';

const EventForm = ({ isEditable, eventId, refetch, mode, setMode }) => {
    const { t } = useTranslation();
    const [form] = CommonForm.useForm();
    const [initialValues, setInitialValues] = useState({});
    const [optionOrganizer, setOptionOrganizer] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const prefix = "event";
    const startRegistrationDate = CommonForm.useWatch("startRegistrationDate", form);
    const endRegistrationDate = CommonForm.useWatch("endRegistrationDate", form);

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
                        isPublic: true
                    });
                    const filePictureName = await getImageFileToUpload({
                        fileList: pictureFileList,
                        prefix,
                        oldKey: eventData?.pictureUrl,
                        isPublic: true
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

                    refetch();
                    AlertSuccess({})
                } catch (err) {
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

                const cleanedData = {
                    ...eventData,
                    showChecklist: eventData?.showChecklist ?? false,
                    eventDate: dayjs(eventData.eventDate),
                    description: await convertStorageToHtml(eventData.description, prefix, getPublicUrl),
                    startRegistrationDate: eventData.startRegistrationDate ? dayjs(eventData.startRegistrationDate) : null,
                    endRegistrationDate: eventData.endRegistrationDate ? dayjs(eventData.endRegistrationDate) : null,
                    paymentTypes: eventData.paymentTypes?.map(p => ({
                        ...p,
                        endDate: dayjs(p.endDate),
                    })) || [],
                    eventDetails: convertedEventDetails,
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

    return (
        <>
            <div className="mb-4">
                <Button
                    type="link"
                    className="center"
                    onClick={() => {
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
                    }}
                >
                    <LeftOutlined size={22} className="me-2" />
                    <p>{t("general.back")}</p>
                </Button>
            </div>
            <Spin spinning={isLoadingEvent}>
                <CommonForm
                    form={form}
                    name="event-form"
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <div className='max-w-screen-lg md:mx-auto' >
                        <CommonForm.Item name="id" noStyle>
                            <Input hidden />
                        </CommonForm.Item>
                        <Row gutter={{ xs: 2, md: 8 }}>
                            <Col xs={24} className='!flex !gap-2 !mb-3'>
                                <CommonForm.Item
                                    name="logoFile"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.logo"),
                                        },
                                    ]}
                                >
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
                                <CommonForm.Item
                                    name="pictureFile"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.coverImg"),
                                        },
                                    ]}
                                >
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
                            </Col>
                        </Row>
                        <Row gutter={{ xs: 2, md: 8 }} align="middle">
                            <Col xs={24} md={16}>
                                <CommonForm.Item
                                    name="generalInfoTitle"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.generalInfoTitle"),
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        size="large"
                                        label={t("back.event.form.generalInfoTitle")}
                                        required
                                        readOnly={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                            {roleUser === "admin" && (
                                <Col xs={24} md={8}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span>{t("back.event.form.showChecklist")}</span>
                                        <CommonForm.Item
                                            name="showChecklist"
                                            valuePropName="checked"
                                            className="!mb-0"
                                        >
                                            <Switch disabled={!isEditable} />
                                        </CommonForm.Item>
                                    </div>
                                </Col>
                            )}
                        </Row>
                        <Row gutter={{ xs: 2, md: 8 }}>
                            <Col xs={24} md={16}>
                                <CommonForm.Item
                                    name="name"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.event"),
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        size="large"
                                        label={t("back.event.form.name")}
                                        required
                                        readOnly={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="type"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.eventType"),
                                        },
                                    ]}
                                >
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
                        </Row>
                        <Row gutter={{ xs: 2, md: 8 }}>
                            <Col xs={24} md={roleUser === "admin" ? 16 : 24}>
                                <CommonForm.Item
                                    name="organizerName"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.organizerName"),
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        size="large"
                                        label={t("back.event.form.organizerName")}
                                        required
                                        readOnly={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                {roleUser === "admin" && (
                                    <CommonForm.Item
                                        name="organizerId"
                                        rules={[
                                            {
                                                required: true,
                                                message: t("organizer"),
                                            },
                                        ]}
                                    >
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
                                )}
                            </Col>
                        </Row>
                        <Row gutter={{ xs: 2, md: 8 }}>
                            <Col xs={24} md={16}>
                                <CommonForm.Item
                                    name="location"
                                >
                                    <FloatingLabel
                                        size="large"
                                        label={t("back.event.form.location")}
                                        readOnly={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="provinceId"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.province"),
                                        },
                                    ]}
                                >
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
                        <Row gutter={{ xs: 2, md: 8 }}>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="startRegistrationDate"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.startRegistrationDate"),
                                        },
                                    ]}
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
                                        {
                                            required: true,
                                            message: t("required.endRegistrationDate"),
                                        },
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
                                        {
                                            required: true,
                                            message: t("required.eventDate"),
                                        },
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
                        <Row gutter={{ xs: 2, md: 8 }}>
                            <Col xs={24} md={12}>
                                <CommonForm.Item
                                    name="link"
                                >
                                    <FloatingLabel
                                        size="large"
                                        label={t("back.event.form.link")}
                                        readOnly={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <CommonForm.Item
                                    name="shippingFee"
                                >
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
                        <Row gutter={{ xs: 2, md: 8 }}>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="eventPrimaryColor"
                                >
                                    <FloatingLabel
                                        type="color"
                                        label={t("back.event.form.eventPrimaryColor")}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="eventSecondaryColor"
                                >
                                    <FloatingLabel
                                        type="color"
                                        label={t("back.event.form.eventSecondaryColor")}
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="eventFontColor"
                                >
                                    <FloatingLabel
                                        type="color"
                                        label={t("back.event.form.eventFontColor")}
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>
                        <Row gutter={{ xs: 2, md: 8 }}>
                            <Col xs={24}>
                                <CommonForm.Item
                                    name="description"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.description"),
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        type="tiptap"
                                        size="large"
                                        label={t("back.event.form.description")}
                                        required
                                        readOnly={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>

                        <Title>{t("back.event.form.paymentTypes")}</Title>
                        <PaymentTypes form={form} />

                        <Row gutter={{ xs: 2, md: 8 }}>
                            <Col xs={24}>
                                <CommonForm.Item
                                    name="eventTypeTitle"
                                    rules={[
                                        {
                                            required: true,
                                            message: t("required.eventTypeTitle"),
                                        },
                                    ]}
                                >
                                    <FloatingLabel
                                        size="large"
                                        label={t("back.event.form.eventTypeTitle")}
                                        required
                                        readOnly={!isEditable}
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>
                        <EventTypes form={form} />

                        <Title>{t("back.event.form.selectionFields")}</Title>
                        <EventSelections form={form} />

                        <Title>{t("back.event.form.conditions")}</Title>
                        <EventConditions form={form} />

                        <Title>{t("back.event.form.shirtTypeAndSize")}</Title>
                        <ShirtTypes form={form} />

                        <Title>{t("back.event.form.additionalInfo")}</Title>
                        <EventDetails form={form} />

                        <div className='flex'>
                            {
                                isEditable &&
                                <div>
                                    <Button
                                        type='primary'
                                        loading={submitting}
                                        htmlType="submit"
                                    >
                                        {t("general.buttonSave")}
                                    </Button>
                                </div>
                            }
                        </div>
                    </div>
                </CommonForm>
            </Spin>
        </>
    )
}

const Title = ({ className, children }) => <div className={`text-lg font-bold mb-3 ${className || ""}`}>{children}</div>

export default EventForm

