import React, { useEffect } from "react";
import { Badge } from "antd";
import backOfficeServices from "services/backoffice.services";

const MenuItemBadge = ({ badgeKey, children, ...props }) => {

  const badgeQueryMap = {
    "eventCalendar": backOfficeServices.useQueryGetNotiEventCalendar,
    "announcement": backOfficeServices.useQueryGetNotiAnnouncement,
  };

  const useQuery = badgeQueryMap[badgeKey];

  const { data, refetch } = useQuery({});

  const count = data?.notiCount || 0;

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);

    return () => clearInterval(interval);
  }, [refetch]);

  return (
    <Badge count={count} {...props}>
      {children}
    </Badge>
  );
};

export default MenuItemBadge;
