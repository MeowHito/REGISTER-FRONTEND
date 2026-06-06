import React, { useMemo } from "react";
import { Tabs } from "antd";
import { useTranslation } from "react-i18next";
import Account from "./account";
import CustomProfile from "./profile";
import UserSetting from "./userSetting";
import Permission from "./permission";
import Menu from "./menu";
import BannerSetting from "./banner";
import SystemAnnouncementList from "pages/backOffice/systemAnnouncement";
import useMe from "hooks/useMe";

export default function Setting() {
  const { t } = useTranslation();

  const {
    data: me,
    fetchStatus: meFetchStatus,
  } = useMe({ retry: 0 });

  const spinning = meFetchStatus === "fetching" && !me;

  const isAdmin = me?.role?.roleType === "admin";

  const items = useMemo(() => {
    const base = [
      {
        key: "1",
        label: t("back.setting.tab.profile"),
        children: <CustomProfile />,
      },
      {
        key: "2",
        label: t("back.setting.tab.password"),
        children: <Account />,
      },
    ];

    if (isAdmin) {
      base.push(
        {
          key: "3",
          label: t("back.setting.tab.user"),
          children: <UserSetting />,
        },
        {
          key: "4",
          label: t("back.setting.tab.permission"),
          children: <Permission />,
        },
        {
          key: "5",
          label: t("back.setting.tab.menu"),
          children: <Menu />,
        },
        {
          key: "6",
          label: t("back.setting.tab.banner"),
          children: <BannerSetting />,
        },
        {
          key: "7",
          label: t("back.setting.tab.systemAnnouncement"),
          children: <SystemAnnouncementList />,
        }
      );
    }
    return base;
  }, [isAdmin, t]);

  if (spinning) return null;

  return <Tabs items={items} defaultActiveKey="1" destroyOnHidden />;
}
