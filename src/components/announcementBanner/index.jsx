import { useCallback, useState } from "react";
import { CloseOutlined, WarningOutlined, ToolOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import generalService from "services/general.services";
import "./index.css";

const DISMISS_KEY = "announcement_dismissed_until";
const DISMISS_DURATION = 24 * 60 * 60 * 1000;

const isDismissed = () => {
  const until = localStorage.getItem(DISMISS_KEY);
  return until && Date.now() < Number(until);
};

const typeConfig = {
  WARNING: { icon: WarningOutlined, className: "announcement-type-warning" },
  MAINTENANCE: { icon: ToolOutlined, className: "announcement-type-maintenance" },
  IMPORTANT: { icon: WarningOutlined, className: "announcement-type-important" },
  INFO: { icon: InfoCircleOutlined, className: "announcement-type-info" },
};

export default function AnnouncementBanner() {
  const { t } = useTranslation();
  const { data: announcements } = generalService.useQueryGetActiveAnnouncements();
  const [visible, setVisible] = useState(!isDismissed());
  const [currentIndex, setCurrentIndex] = useState(0);

  const items = announcements || [];

  const handleAnimationIteration = useCallback(() => {
    if (items.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }
  }, [items.length]);

  const handleClose = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DURATION));
    setVisible(false);
  }, []);

  if (!visible || items.length === 0) return null;

  const current = items[currentIndex];
  const config = typeConfig[current.type] || typeConfig.INFO;
  const IconComponent = config.icon;

  return (
    <div className={`announcement-banner-overlay ${config.className}`}>
      <div className="announcement-banner-inner">
        <IconComponent className="announcement-banner-icon" />
        <div className="announcement-banner-content">
          <div
            key={currentIndex}
            className="announcement-banner-slide"
            onAnimationIteration={handleAnimationIteration}
          >
            <span className="announcement-banner-title">{current.title}</span>
            {current.message && (
              <span className="announcement-banner-message"> — {current.message}</span>
            )}
          </div>
        </div>
        {items.length > 1 && (
          <span className="announcement-banner-counter">
            {currentIndex + 1}/{items.length}
          </span>
        )}
        <button
          className="announcement-banner-close"
          onClick={handleClose}
          aria-label={t("front.announcement.close")}
        >
          <CloseOutlined />
        </button>
      </div>
    </div>
  );
}
