import React from "react";
import { Tabs } from "antd";
import {
  AppstoreOutlined,
  LockOutlined,
  NotificationOutlined,
  PictureOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import PageHeader from "components/pageHeader";
import { useTranslation } from "react-i18next";
import Account from "./account";
import CustomProfile from "./profile";
import UserSetting from "./userSetting";
import Permission from "./permission";
import Menu from "./menu";
import BannerSetting from "./banner";
import SystemAnnouncementList from "pages/backOffice/systemAnnouncement";
import useMe from "hooks/useMe";

const tabLabel = (icon, text) => (
  <span className="inline-flex items-center gap-2">
    {icon}
    {text}
  </span>
);

// Tabs whose content is a bare table/form get a white card around them.
const inCard = (node) => <div className="bo-card bo-card-pad">{node}</div>;

export default function Setting() {
  const { t } = useTranslation();

  const {
    data: me,
    fetchStatus: meFetchStatus,
  } = useMe({ retry: 0 });

  const spinning = meFetchStatus === "fetching" && !me;

  const isAdmin = me?.role?.roleType === "admin";

  // Rebuilt every render so tab labels follow a language switch.
  const items = (() => {
    const base = [
      {
        key: "1",
        label: tabLabel(<UserOutlined />, t("back.setting.tab.profile")),
        children: <CustomProfile />,
      },
      {
        key: "2",
        label: tabLabel(<LockOutlined />, t("back.setting.tab.password")),
        children: inCard(<Account />),
      },
    ];

    if (isAdmin) {
      base.push(
        {
          key: "3",
          label: tabLabel(<TeamOutlined />, t("back.setting.tab.user")),
          children: inCard(<UserSetting />),
        },
        {
          key: "4",
          label: tabLabel(<SafetyCertificateOutlined />, t("back.setting.tab.permission")),
          children: inCard(<Permission />),
        },
        {
          key: "5",
          label: tabLabel(<AppstoreOutlined />, t("back.setting.tab.menu")),
          children: inCard(<Menu />),
        },
        {
          key: "6",
          label: tabLabel(<PictureOutlined />, t("back.setting.tab.banner")),
          children: inCard(<BannerSetting />),
        },
        {
          key: "7",
          label: tabLabel(<NotificationOutlined />, t("back.setting.tab.systemAnnouncement")),
          children: inCard(<SystemAnnouncementList />),
        }
      );
    }
    return base;
  })();

  if (spinning) return null;

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: t("back.shell.home") },
          { label: t("back.shell.group.system") },
          { label: t("back.menu.setting.name") },
        ]}
        title={t("back.menu.setting.name")}
        subtitle={t("back.setting.subtitle")}
      />
      <Tabs className="bo-tabs" items={items} defaultActiveKey="1" destroyOnHidden />
    </>
  );
}
