import React from "react";
import { Card, Tag } from "antd";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

const EventCalendarCard = ({ event }) => {
  const { t } = useTranslation();

  if (!event) return null;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="cursor-pointer">
        <a
          href={event?.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Card
            className="w-full p-0 overflow-hidden rounded-xl shadow-md border-none"
            hoverable
            styles={{
              body: {
                padding: 12,
              },
            }}
          >
            <div className="flex flex-row items-stretch">
              <div className="bg-blue-50 w-1/4 flex flex-col justify-center items-center border-r border-gray-200 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">
                  {dayjs(event?.eventDate).format("DD")}
                </div>
                <div className="text-sm text-gray-600 uppercase">
                  {dayjs(event?.eventDate).format("MMM YYYY")}
                </div>
              </div>
              <div className="w-3/4 px-2 flex flex-col justify-between">
                <div>
                  <div className="text-xl font-semibold text-gray-800 mb-2">
                    {event?.eventName}
                  </div>
                  {/* <Tag
                    bordered={false}
                    color="blue"
                  >
                    {event?.location}
                  </Tag> */}
                  <p className="text-sm text-gray-600">
                    <strong>{t("back.eventCalendarList.eventType")}:</strong>{" "}
                    {event?.eventType}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>{t("back.eventCalendarList.location")}:</strong>{" "}
                    {event?.location}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </a>
      </div>
    </div>
  );
};

export default EventCalendarCard;
