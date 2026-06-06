import { logo_white } from "assets";
import { Link } from "react-router-dom";
import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "antd";

const bottomMenu = [
  {
    key: "allEvents",
    link: "/event",
  },
  {
    key: "eventCalendar",
    link: "/eventCalendar",
  },
  {
    key: "contactChannel",
    link: "/contact",
  },
];

export default function Footer({ layout }) {
  const { t } = useTranslation();

  return (
    <div className="footer">
      {layout != "compact" ? (
        <div className="footer-top hidden md:block">
          <div className="container">
            <div className="footer-content md:max-w-screen-lg mx-auto">
              <div className="footer-social">
                <ul className="global-list">
                  <li>
                    <a href="https://www.facebook.com/@action.in.th" target="_blank" rel="noopener noreferrer" title="Facebook">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                  </li>
                  <li>
                    <a href="https://wa.me/message/W6KZXL2IWEH5N1" target="_blank" rel="noopener noreferrer" title="WhatsApp">
                      <i className="fab fa-whatsapp"></i>
                    </a>
                  </li>
                  <li>
                    <a href="https://line.me/R/ti/p/@action.in.th" target="_blank" rel="noopener noreferrer" title="LINE">
                      <i className="fab fa-line"></i>
                    </a>
                  </li>
                  <li>
                    <a href="https://photo.action.in.th" target="_blank" rel="noopener noreferrer" title="Action Gallery">
                      <i className="fas fa-image"></i>
                    </a>
                  </li>
                  <li>
                    <a href="https://www.instagram.com/action.in.th" target="_blank" rel="noopener noreferrer" title="Instagram">
                      <i className="fab fa-instagram"></i>
                    </a>
                  </li>
                </ul>
              </div>

              <div className="flex flex-wrap -mx-3">
                <div className="w-full md:w-1/2 lg:w-1/3 px-3 mb-6">
                  <div className="footer-widget">
                    <div className="footer-logo">
                      <img src={logo_white} alt="Logo" className="max-w-full h-auto" />
                    </div>
                    <p>{t("front.footer.description")}</p>
                  </div>
                </div>

                <div className="w-full md:w-1/2 lg:w-1/3 px-3 mb-6">
                  <div className="footer-widget md:px-4">
                    <h3>{t("front.footer.otherMenu")}</h3>
                    <ul className="global-list">
                      {bottomMenu?.map((menu, index) => (
                        <li key={index}>
                          <Link to={menu.link}>
                            <p>{t(`front.footer.${menu.key}`)}</p>
                          </Link>
                        </li>
                      ))}
                      <li>
                        <a href="https://photo.action.in.th" target="_blank" rel="noopener noreferrer">
                          <p>{t("front.footer.searchPhotos")}</p>
                        </a>
                      </li>
                      <li>
                        <a href="https://timing.action.in.th" target="_blank" rel="noopener noreferrer">
                          <p>{t("front.footer.raceResults")}</p>
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="w-full md:w-1/2 lg:w-1/3 px-3 mb-6">
                  <div className="footer-widget">
                    <div className="payment-gateway">
                      <h4>{t("front.footer.contact")}</h4>
                      <p>{t("front.footer.address")}</p>
                      <p>Email: Action.in.th@gmail.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="footer-bottom">
        <div className="container text-center">
          <span className="block text-sm text-center">
            © 2022-{new Date().getFullYear()} Action in thai™. {t("front.footer.rightsReserved")}
          </span>
        </div>
      </div>
    </div>
  );
}
