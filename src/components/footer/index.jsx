import { logo_black } from "assets";
import { Link } from "react-router-dom";
import React from "react";
import { useTranslation } from "react-i18next";

const socials = [
  { href: "https://www.facebook.com/@action.in.th", title: "Facebook", icon: "fab fa-facebook-f" },
  { href: "https://wa.me/message/W6KZXL2IWEH5N1", title: "WhatsApp", icon: "fab fa-whatsapp" },
  { href: "https://line.me/R/ti/p/@action.in.th", title: "LINE", icon: "fab fa-line" },
  { href: "https://www.instagram.com/action.in.th", title: "Instagram", icon: "fab fa-instagram" },
  { href: "https://photo.action.in.th", title: "Action Gallery", icon: "fas fa-image" },
];

const menuLinks = [
  { key: "allEvents", to: "/event" },
  { key: "eventCalendar", to: "/eventCalendar" },
  { key: "contactChannel", to: "/contact" },
  { key: "searchPhotos", href: "https://photo.action.in.th" },
  { key: "raceResults", href: "https://timing.action.in.th" },
];

export default function Footer({ layout }) {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-surfacex-highest border-t border-gray-300/60">
      {layout !== "compact" && (
        <div className="max-w-[1200px] mx-auto px-5 md:px-6 py-10 md:py-14">
          <div className="flex flex-col md:flex-row justify-between gap-10">
            {/* Brand */}
            <div className="max-w-sm">
              <img src={logo_black} alt="Action" className="h-10 w-auto mb-4" />
              <p className="text-inkx-variant text-sm leading-relaxed">
                {t("front.footer.description")}
              </p>
              <div className="flex items-center gap-3 mt-5">
                {socials.map((s) => (
                  <a
                    key={s.title}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.title}
                    className="w-9 h-9 rounded-full bg-white text-inkx-variant border border-gray-200 flex items-center justify-center hover:bg-brand hover:text-white hover:border-brand transition-colors"
                  >
                    <i className={s.icon}></i>
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 gap-10 md:gap-16">
              <div>
                <h4 className="text-brand font-bold mb-4">{t("front.footer.otherMenu")}</h4>
                <ul className="space-y-3 text-sm">
                  {menuLinks.map((m) => (
                    <li key={m.key}>
                      {m.to ? (
                        <Link to={m.to} className="text-inkx-variant hover:text-brand transition-colors">
                          {t(`front.footer.${m.key}`)}
                        </Link>
                      ) : (
                        <a
                          href={m.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-inkx-variant hover:text-brand transition-colors"
                        >
                          {t(`front.footer.${m.key}`)}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-brand font-bold mb-4">{t("front.footer.contact")}</h4>
                <ul className="space-y-3 text-sm text-inkx-variant">
                  <li>{t("front.footer.address")}</li>
                  <li>
                    <a href="mailto:Action.in.th@gmail.com" className="hover:text-brand transition-colors">
                      Action.in.th@gmail.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-gray-300/60">
        <div className="max-w-[1200px] mx-auto px-5 md:px-6 py-5 text-center">
          <span className="block text-sm text-inkx-variant">
            © 2022-{new Date().getFullYear()} Action in thai™. {t("front.footer.rightsReserved")}
          </span>
        </div>
      </div>
    </footer>
  );
}
