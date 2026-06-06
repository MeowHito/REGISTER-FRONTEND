import React, { useEffect, useState } from 'react';
import { Modal, Row, Col, Upload, Button, message, Spin } from 'antd';
import CommonForm from "components/commonForm";
import { useTranslation } from 'react-i18next';
import { AlertSuccess, AlertError, AlertConfirm, AlertClosed } from 'components/alert';
import dayjs from 'dayjs';
import backOfficeServices from 'services/backoffice.services';
import { errorToMessage } from 'hooks/functions/errorToMessage';
import { CopyOutlined, UploadOutlined } from '@ant-design/icons';
import useUploadFileHook from 'hooks/useUploadFileHook';
import { dummyRequest } from 'hooks/dummyRequest';
import { onUploadFile } from 'hooks/onUploadFile';
import fileService from 'services/file.services';
import FloatingLabel from 'components/floatingLabel';
import { SYS_DATE_FORMAT } from 'constants/helper';
import useMe from 'hooks/useMe';
import { toStartOfDay, toStartOfDayISO } from 'utils/format';

const AnnouncementForm = ({ isEditable, data, open, onCancel, refetch, mode }) => {
    const { t } = useTranslation();
    const [form] = CommonForm.useForm();
    const [eventOption, setEventOption] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        data: me
    } = useMe({ retry: 0 });
    const roleUser = me?.role?.roleType;

    const {
        fileList: imgFileList,
        setFileList: setImgFileList,
        previewImage: imgPreviewImage,
        previewOpen: imgPreviewOpen,
        handlePreview: handleImgPreview,
        handleChange: handleImgChange,
        handleCancel: handleImgCancel,
    } = useUploadFileHook();

    const { data: dataEvent, isFetching: isLoadingEvent } = backOfficeServices.useQueryGetAllActiveEvents({});

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

    const { data: dataAnnouncement, refetch: refetchAnnouncement, isFetching: isLoadingAnnouncement } = backOfficeServices.useQueryGetAnnouncementById({
        id: data?.id,
    });

    useEffect(() => {
        if (dataAnnouncement) {
            const selectedEvent = eventOption.find((event) => event.value === data.eventId);
            let _field = {
                ...dataAnnouncement,
                createDate: toStartOfDay(dataAnnouncement?.createDate),
                startDate: toStartOfDay(dataAnnouncement?.startDate),
                eventDate: selectedEvent ? dayjs(selectedEvent?.eventDate) : null,
            };

            const imgList = dataAnnouncement?.mediaFiles?.map((media, index) => ({
                uid: `-${index + 1}`,
                name: media?.path,
                status: "done",
                url: media?.thumbUrl,
            })) || [];

            setImgFileList(imgList);
            form.setFieldsValue(_field);
        }
    }, [dataAnnouncement]);

    useEffect(() => {
        if (open && data) {
            refetchAnnouncement()
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

    const { mutateAsync: createAnnouncement } = backOfficeServices.useMutationCreateAnnouncement(
        (res) => {
            const { success, message } = res;
            if (success) {
                form.resetFields();
                refetch();
                setImgFileList([]);
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

    const { mutateAsync: updateAnnouncement } = backOfficeServices.useMutationUpdateAnnouncement(
        (res) => {
            const { success, message } = res;
            if (success) {
                form.resetFields();
                refetch();
                setImgFileList([]);
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

    const onFinish = (values) => {
        AlertConfirm({
            onOk: async () => {
                try {
                    setIsSubmitting(true);
                    const prefix = "announcement";
                    let mediaFiles = [];

                    const oldMediaList = dataAnnouncement?.mediaFiles || [];
            for (const file of imgFileList) {
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
                ...dataAnnouncement,
                ...values,
                startDate: toStartOfDayISO(values?.startDate),
                prefixPath: prefix,
                mediaFiles: mediaFiles,
                isRead: false,
                eventName: eventOption?.find(e => e.value === values.eventId)?.label || ""
            };
            await (data?.id ? updateAnnouncement(isData) : createAnnouncement(isData));
                } catch (err) {
                    AlertError({ text: errorToMessage(err) })
                } finally {
                    setIsSubmitting(false);
                }
            }
        });
    };

    const { mutateAsync: downloadZip } = fileService.useMutationZipAnnouncement();

    const handleCopyAll = async () => {
        try {
            setIsLoading(true);

            const values = form.getFieldsValue();

            const selectedEvent = eventOption.find(e => e.value === values.eventId);
            const eventName = selectedEvent?.label || "";
            const formatDate = (d) => d ? dayjs(d).format(SYS_DATE_FORMAT) : "";

            const textLines = [
                `${t("back.announcement.name")}`,
                `📢 ${t("back.announcement.title")}: ${values.title || ""}`,
                `📄 ${t("back.announcement.detail")}: ${values.detail || ""}`,
                `🎪 ${t("back.announcement.event")}: ${eventName}`,
                `📅 ${t("back.announcement.eventDate")}: ${formatDate(values.eventDate)}`,
                `🕓 ${t("back.announcement.startDate")}: ${formatDate(values.startDate)}`,
            ];

            const textToCopy = textLines.join("\n").trim();

            const imgList = dataAnnouncement?.mediaFiles?.map((media) => ({
                url: media?.thumbUrl || "",
                filename: media?.path || `image-${Date.now()}.jpg`,
            })) || [];

            if (imgList.length > 0) {
                await downloadZip({
                    name: values.title,
                    images: imgList
                });
            }
            await navigator.clipboard.writeText(textToCopy);
            message.success(t("general.copySuccess"));
        } catch {
            message.error(t("general.copyError"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            width={"90%"}
            className='md:!max-w-screen-lg !mx-auto !pt-3'
            title={
                mode === "new" ? t("back.announcement.new") : mode === "edit" ? t("back.announcement.edit") : t("back.announcement.view")
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
                setImgFileList([]);
                onCancel();
            }}
            okText={t("general.buttonSave")}
            cancelText={t("general.buttonCancel")}
        >
            <Spin spinning={isLoadingAnnouncement}>
                <CommonForm
                    form={form}
                    name="announcement-form"
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
                                        disabled={!isEditable || isLoadingEvent}
                                        label={t("back.announcement.event")}
                                        placeholder={t("back.announcement.selectEvent")}
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
                                        label={t("back.announcement.eventDate")}
                                        disabled
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="createDate"
                                    initialValue={toStartOfDay()}
                                    getValueProps={(value) => ({ value: value ? dayjs(value) : null })}
                                >
                                    <FloatingLabel
                                        type="date"
                                        label={t("back.announcement.createDate")}
                                        disabled
                                    />
                                </CommonForm.Item>
                            </Col>
                            <Col xs={24} md={8}>
                                <CommonForm.Item
                                    name="startDate"
                                    rules={[{ required: true, message: t("required.startDate") }]}
                                >
                                    <FloatingLabel
                                        type="date"
                                        label={t("back.announcement.startDate")}
                                        disabled={!isEditable}
                                        required
                                    />
                                </CommonForm.Item>
                            </Col>
                        </Row>
                        <CommonForm.Item
                            name="title"
                            rules={[{ required: true, message: t("required.announcementTitle") }]}
                        >
                            <FloatingLabel
                                label={t("back.announcement.title")}
                                placeholder={t("back.announcement.title")}
                                required
                                disabled={!isEditable}
                            />
                        </CommonForm.Item>
                        <CommonForm.Item
                            name="detail"
                        >
                            <FloatingLabel
                                type="textarea"
                                label={t("back.announcement.detail")}
                                rows={4}
                                disabled={!isEditable}
                            />
                        </CommonForm.Item>
                        <p className="mb-2">{t("back.announcement.uploadImg")}</p>
                        <Upload
                            customRequest={dummyRequest}
                            fileList={imgFileList}
                            accept="image/png, image/jpeg"
                            listType="picture-card"
                            maxCount={10}
                            multiple
                            onPreview={handleImgPreview}
                            onChange={handleImgChange}
                            disabled={!isEditable}
                        >
                            {(imgFileList.length < 10 && isEditable) ? (
                                <div>
                                    <UploadOutlined size={20} className="mb-2" />
                                    <p>{t("general.uploadImg")}</p>
                                </div>
                            ) : null}
                        </Upload>
                        {roleUser === "admin" && (
                            <div style={{ textAlign: "right", marginTop: 16 }}>
                                <Button
                                    icon={<CopyOutlined />}
                                    onClick={handleCopyAll}
                                    disabled={isLoading}
                                >
                                    {t("general.copyAll") || "คัดลอกทั้งหมด"}
                                </Button>
                            </div>
                        )}
                    </div>
                </CommonForm>
            </Spin>
            <Modal open={imgPreviewOpen} footer={null} onCancel={handleImgCancel}>
                <img
                    alt="profile-img"
                    style={{
                        width: "100%",
                    }}
                    src={imgPreviewImage}
                />
            </Modal>
        </Modal>
    );
};

export default AnnouncementForm;


