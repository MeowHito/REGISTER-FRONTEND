import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Select, Tabs, Spin } from "antd";
import { handleQueryStatus } from "utils";
import backOfficeServices from "services/backoffice.services";
import { useTranslation } from "react-i18next";
import { useMediaQuery } from "react-responsive";
import useMe from "hooks/useMe";

import Gender from "./tabs/gender";
import AgeGroup from "./tabs/ageGroup";
import Shirt from "./tabs/shirt";
import Province from "./tabs/province";
import RegistrationDateTime from "./tabs/registrationDateTime";
import General from "./tabs/general";
import useCountryStateHook from "hooks/useCountryStateHook";

const DashboardRegistration = () => {
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const isTablet = useMediaQuery({ query: "(max-width: 1024px)" });
  const [organizerOption, setOrganizerOption] = useState([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState("");
  const [eventOptions, setEventOptions] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [isDataReady, setIsDataReady] = useState(false);

  const { data: me } = useMe({ retry: 0 });
  const roleUser = me?.role?.roleType;

  const { provinceOption } = useCountryStateHook();

  const { data: organizerGroupsRaw, isFetching: isLoadingData } = backOfficeServices.useQueryGetAllOrganizers();

  const {
    data: dashboardData,
    isFetching: isFetchingDashboard,
    ...otherDashboard
  } = backOfficeServices.useQueryGetDashboardRegistration({
    eventId: selectedEvent,
  });

  const organizerGroups = useMemo(() => {
    const rows = Array.isArray(organizerGroupsRaw) ? organizerGroupsRaw : [];

    if (roleUser === "organizer" && me?.uuid) {
      return rows.filter((g) => g?.organizerId === me.uuid);
    }
    return rows;
  }, [organizerGroupsRaw, roleUser, me?.uuid]);

  useEffect(() => {
    if (!organizerGroups || organizerGroups.length === 0) {
      setOrganizerOption([]);
      setEventOptions([]);
      setSelectedOrganizer("");
      setSelectedEvent("");
      return;
    }

    const organizerOpts = organizerGroups.map((g) => ({
      value: g.organizerId,
      label: g.organizerName || "Unknown Organizer",
    }));
    setOrganizerOption(organizerOpts);

    const nextOrganizer =
      organizerOpts.some((o) => o.value === selectedOrganizer)
        ? selectedOrganizer
        : organizerOpts[0]?.value;

    if (nextOrganizer && nextOrganizer !== selectedOrganizer) {
      setSelectedOrganizer(nextOrganizer);
    }

    const group = organizerGroups.find((g) => g.organizerId === nextOrganizer) || organizerGroups[0];
    const eventOpts = (group?.events || []).map((e) => ({
      value: e.eventId,
      label: e.eventName,
      eventDate: e.eventDate,
    }));
    setEventOptions(eventOpts);

    setSelectedEvent((prev) => {
      if (eventOpts.some((x) => x.value === prev)) return prev;
      return eventOpts[0]?.value ?? "";
    });
  }, [organizerGroups, selectedOrganizer]);

  useEffect(() => {
    handleQueryStatus(
      otherDashboard,
      () => {
        if (dashboardData) {
          setIsDataReady(true);
        }
      },
      () => {
        console.error("Error fetching dashboard registration data");
      }
    );
  }, [otherDashboard.status, otherDashboard.fetchStatus]);

  useEffect(() => {
    setIsDataReady(false);
  }, [selectedEvent]);

  const handleChangeOrganizer = (organizerId) => {
    setSelectedOrganizer(organizerId);

    const group = organizerGroups?.find((g) => g.organizerId === organizerId);
    const eventOpts = (group?.events || []).map((e) => ({
      value: e.eventId,
      label: e.eventName,
      eventDate: e.eventDate,
    }));

    setEventOptions(eventOpts);
    setSelectedEvent(eventOpts[0]?.value ?? "");
  };

  const provinceNameById = useMemo(() => {
    const m = new Map();

    (provinceOption || []).forEach((group) => {
      (group?.options || []).forEach((p) => {
        if (p?.value != null) m.set(String(p.value), p.label);
      });
    });

    return m;
  }, [provinceOption]);

  const normalizedDashboardData = useMemo(() => {
    if (!dashboardData) return dashboardData;

    const src = dashboardData.participantByProvince || {};
    const out = {};

    Object.entries(src).forEach(([key, count]) => {
      if (!key) return;

      const k = String(key).trim();

      if (k.toUpperCase() === "UNKNOWN") {
        out["UNKNOWN"] = (out["UNKNOWN"] || 0) + (Number(count) || 0);
        return;
      }

      const name = provinceNameById.get(k) || k;
      out[name] = (out[name] || 0) + (Number(count) || 0);
    });

    return { ...dashboardData, participantByProvince: out };
  }, [dashboardData, provinceNameById]);

  const tabProps = useMemo(
    () => ({
      t,
      i18n,
      isMobile,
      isTablet,
      dashboardData: normalizedDashboardData,
      isDataReady,
      eventOptions,
      selectedEvent,
    }),
    [t, i18n, isMobile, isTablet, normalizedDashboardData, isDataReady, eventOptions, selectedEvent]
  );

  return (
    <Spin spinning={isLoadingData}>
      <div className="w-full h-auto mx-auto">
        {roleUser === "admin" && (
          <Row gutter={[16, 16]} className="mb-8">
            <Col xs={24} sm={12}>
              <label className="block text-xl font-semibold opacity-60 mb-2">
                {t("back.dashboard.organizer")}
              </label>
              <Select
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
                value={selectedOrganizer}
                onChange={handleChangeOrganizer}
                options={organizerOption}
              />
            </Col>
            <Col xs={24} sm={12}>
              <label className="block text-xl font-semibold opacity-60 mb-2">
                {t("back.dashboard.event")}
              </label>
              <Select
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
                value={selectedEvent}
                onChange={(value) => setSelectedEvent(value)}
                options={eventOptions}
              />
            </Col>
          </Row>
        )}
        {roleUser === "organizer" && (
          <Row gutter={[16, 16]} className="mb-8">
            <Col xs={24}>
              <label className="text-xl font-semibold opacity-60 mb-2">
                {t("back.dashboard.event")}
              </label>
              <Select
                showSearch
                optionFilterProp="label"
                style={{ width: "100%" }}
                value={selectedEvent}
                onChange={(value) => setSelectedEvent(value)}
                options={eventOptions}
              />
            </Col>
          </Row>
        )}

        <Spin spinning={isFetchingDashboard}>
          <Tabs
            defaultActiveKey="general"
            items={[
              { key: "general", label: t("back.dashboard.general"), children: <General {...tabProps} /> },
              { key: "gender", label: t("back.dashboard.gender"), children: <Gender {...tabProps} /> },
              { key: "ageGroup", label: t("back.dashboard.age"), children: <AgeGroup {...tabProps} /> },
              { key: "shirt", label: t("back.dashboard.shirt"), children: <Shirt {...tabProps} /> },
              { key: "province", label: t("back.dashboard.province"), children: <Province {...tabProps} /> },
              { key: "registrationDateTime", label: t("back.dashboard.registration"), children: <RegistrationDateTime {...tabProps} /> },
            ]}
          />
        </Spin>
      </div>
    </Spin>
  );
};

export default DashboardRegistration;
