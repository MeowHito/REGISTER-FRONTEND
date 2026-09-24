import React, { useState, useEffect } from "react";
import { Descriptions, Button, Tag, Spin } from "antd";
import { EditOutlined } from "@ant-design/icons";
import backOfficeServices from "services/backoffice.services";
import { useTranslation } from "react-i18next";
import { handleQueryStatus } from "utils";
import EventCalendarForm from "../eventCalendarForm";
import dayjs from "dayjs";
import { SYS_DATE_FORMAT } from "constants/helper";
import useMe from "hooks/useMe";
import PageHeader from "components/pageHeader";

const EventCalendarDetails = ({ eventId: id, onBack }) => {
  const { t } = useTranslation();
  const [event, setEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isFetching, refetch, ...other } = backOfficeServices.useQueryGetEventCalendarDetails({ id });

  const {
    data: me
  } = useMe({ retry: 0 });
  const roleUser = me?.role?.roleType;

  useEffect(() => {
    handleQueryStatus(other,
      () => {
        if (!data) return;
        setEvent(data);
      },
    );
  }, [other.fetchStatus]);

  useEffect(() => {
    if (id) {
      refetch();
    }
  }, [id, refetch]);

  const getStatusTag = (status) => {
    if (status === true)
      return <Tag color="green">{t("back.eventCalendarList.approved")}</Tag>;
    if (status === false)
      return <Tag color="red">{t("back.eventCalendarList.rejected")}</Tag>;
    return <Tag color="orange">{t("back.eventCalendarList.pending")}</Tag>;
  };

  const handleEdit = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const items = [
    {
      key: "type",
      label: t("back.eventCalendarList.eventType"),
      children: event?.eventType,
    },
    {
      key: "date",
      label: t("back.eventCalendarList.eventDate"),
      children: event?.eventDate
        ? dayjs(event.eventDate).format(SYS_DATE_FORMAT)
        : null,
    },
    {
      key: "location",
      label: t("back.eventCalendarList.location"),
      children: event?.location,
    },
    {
      key: "moreDetails",
      label: t("back.eventCalendarList.moreDetails"),
      children: event?.extraDetail,
    },
    {
      key: "link",
      label: t("back.eventCalendarList.link"),
      children: event?.link ? (
        <a href={event.link} target="_blank" rel="noopener noreferrer">
          {event.link}
        </a>
      ) : (
        "-"
      ),
    },
    {
      key: "submitter",
      label: t("back.eventCalendarList.submitterName"),
      children: event?.submitterName,
    },
    {
      key: "email",
      label: t("back.eventCalendarList.email"),
      children: event?.email || "-",
    },
    {
      key: "phone",
      label: t("back.eventCalendarList.phone"),
      children: event?.phone || "-",
    },
  ];

  return (
    <Spin spinning={isFetching}>
      <div>
        <PageHeader
          onBack={() => onBack()}
          backLabel={t("back.couponList.back")}
          title={event?.eventName}
          tag={getStatusTag(event?.isApproved)}
          extra={roleUser === "admin" && (
            <Button type="primary" icon={<EditOutlined />} onClick={handleEdit} loading={isSubmitting}>
              {t("back.eventCalendarList.edit")}
            </Button>
          )}
        />
        <div className="bo-card bo-card-pad">
        <Descriptions
          bordered
          column={1}
          className="!mt-4"
          styles={{ label: { width: 160 } }}
          items={items}
        />
        </div>
        <EventCalendarForm
          mode="edit"
          open={isModalOpen}
          onCancel={handleCloseModal}
          data={event}
          onSuccess={() => {
            refetch();
          }}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
        />
      </div>
    </Spin>
  );
};

export default EventCalendarDetails;
