import React, { useEffect } from "react";
import { Modal } from "antd";
import CommonForm from "components/commonForm";
import {
  AlertConfirm,
  AlertSuccess,
  AlertError,
  AlertClosed,
} from "components/alert";
import backOfficeServices from "services/backoffice.services";
import { errorToMessage } from "hooks/functions/errorToMessage";
import { useTranslation } from "react-i18next";
import FloatingLabel from "components/floatingLabel";
import { eventTypeOption } from 'constants/options/eventTypeOption';
import useCountryStateHook from "hooks/useCountryStateHook";
import { toStartOfDay, toStartOfDayISO } from "utils/format";
import generalService from "services/general.services";

const EventCalendarForm = ({ open, onCancel, mode, data, onSuccess, isSubmitting, setIsSubmitting, isPublic = false }) => {
  const { t } = useTranslation();
  const [form] = CommonForm.useForm();
  const {
    provinceOption,
    isLoadingProvince
  } = useCountryStateHook({ valueKey: 'stateLocal' });

  const { mutate: createEventCalendar } =
    backOfficeServices.useMutationCreateEventCalendar(
      (res) => {
        setIsSubmitting(false);
        const { success, message } = res;
        if (success) {
          form.resetFields();
          AlertClosed();
          onCancel();
          AlertSuccess({});
        } else {
          AlertError({ text: message });
        }
      },
      (err) => {
        setIsSubmitting(false);
        AlertError({
          text: errorToMessage(err?.response?.data?.message || err),
        });
      }
    );

  const { mutate: createPublicEventCalendar } =
    generalService.useMutationCreateEventCalendar(
      (res) => {
        setIsSubmitting(false);
        const { success, message } = res;
        if (success) {
          form.resetFields();
          AlertClosed();
          onCancel();
          AlertSuccess({});
        } else {
          AlertError({ text: message });
        }
      },
      (err) => {
        setIsSubmitting(false);
        AlertError({
          text: errorToMessage(err?.response?.data?.message || err),
        });
      }
    );

  const { mutate: updateEventCalendar } =
    backOfficeServices.useMutationUpdateEventCalendar(
      (res) => {
        setIsSubmitting(false);
        const { success, message } = res;
        if (success) {
          AlertClosed();
          onSuccess();
          onCancel();
          AlertSuccess({});
        } else {
          AlertError({ text: message });
        }
      },
      (err) => {
        setIsSubmitting(false);
        AlertError({
          text: errorToMessage(err?.response?.data?.message || err),
        });
      }
    );

  useEffect(() => {
    if (mode === "edit" && data) {
      form.setFieldsValue({
        ...data,
        eventDate: toStartOfDay(data.eventDate, null),
      });
    } else {
      form.resetFields();
    }
  }, [mode, data, form]);

  const handleFinish = (values) => {
    AlertConfirm({
      onOk: () => {
        setIsSubmitting(true);
        const payload = {
          ...values,
          eventDate: toStartOfDayISO(values.eventDate),
        };
        if (mode === "edit" && data?.eventId) {
          updateEventCalendar({ ...payload, eventId: data?.eventId });
        } else {
          if (isPublic) {
            createPublicEventCalendar(payload);
          } else {
            createEventCalendar(payload);
          }
        }
      },
    });
  };

  return (
    <Modal
      title={t("back.eventCalendarList.submission")}
      open={open}
      onCancel={onCancel}
      confirmLoading={isSubmitting}
      onOk={() => {
        form.submit();
      }}
      okText={t("general.buttonSave")}
      cancelText={t("general.buttonCancel")}
    >
      <CommonForm form={form} layout="vertical" onFinish={handleFinish}>
        <CommonForm.Item
          name="eventName"
          rules={[{ required: true, message: t("required.event") }]}
          className="!mb-7"
        >
          <FloatingLabel
            label={t("back.eventCalendarList.eventName")}
            type="text"
            required
          />
        </CommonForm.Item>
        <div className="flex gap-2">
          <CommonForm.Item
            name="eventType"
            rules={[{ required: true, message: t("required.eventType") }]}
            className="!w-full !mb-7"
          >
            <FloatingLabel
              label={t("back.eventCalendarList.selectEventType")}
              type="select"
              required
              allowClear
              showSearch
              options={eventTypeOption}
            />
          </CommonForm.Item>
          <CommonForm.Item
            name="eventDate"
            rules={[{ required: true, message: t("required.eventDate") }]}
            className="!w-full !mb-7"
          >
            <FloatingLabel
              label={t("back.eventCalendarList.eventDate")}
              type="date"
              placeholder=""
              required
            />
          </CommonForm.Item>
        </div>
        <CommonForm.Item
          name="location"
          rules={[{ required: true, message: t("required.location") }]}
          className="!mb-7"
        >
          <FloatingLabel
            label={t("back.eventCalendarList.location")}
            type="select"
            required
            allowClear
            showSearch
            disabled={isLoadingProvince}
            options={provinceOption}
            filterOption={(input, option) => {
              const str = option.filterLabel || (typeof option.label === 'string' ? option.label : '');
              return str.toLowerCase().includes(input.toLowerCase());
            }}
          />
        </CommonForm.Item>
        <CommonForm.Item name="extraDetail" className="!mb-7">
          <FloatingLabel label={t("back.eventCalendarList.moreDetails")} type="text" />
        </CommonForm.Item>
        <CommonForm.Item
          name="link"
          rules={[{ required: true, message: t("required.link") }]}
          className="!mb-7"
        >
          <FloatingLabel
            label={t("back.eventCalendarList.link")}
            type="text"
            required
          />
        </CommonForm.Item>
        <CommonForm.Item
          name="submitterName"
          rules={[{ required: true, message: t("required.submitterName") }]}
          className="!mb-7"
        >
          <FloatingLabel
            label={t("back.eventCalendarList.submitterName")}
            type="text"
            required
          />
        </CommonForm.Item>
        <div className="flex gap-2">
          <CommonForm.Item
            name="email"
            rules={[
              { required: true, message: t("required.email") },
              { type: "email", message: t("validation.email") },
            ]}
            className="!w-full !mb-7"
          >
            <FloatingLabel
              label={t("back.eventCalendarList.email")}
              type="text"
              required
            />
          </CommonForm.Item>
          <CommonForm.Item
            name="phone"
            rules={[
              { required: true, message: t("required.phone") },
              {
                pattern: /^[0-9]{7,15}$/,
                message: t("validation.number"),
              },
            ]}
            className="!w-full !mb-7"
          >
            <FloatingLabel
              label={t("back.eventCalendarList.phone")}
              type="text"
              maxLength={15}
              required
            />
          </CommonForm.Item>
        </div>
      </CommonForm>
    </Modal>
  );
};

export default EventCalendarForm;

