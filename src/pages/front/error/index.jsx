import React from 'react'
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

export default function Error() {
  const { t } = useTranslation();
  return (
    <div className="center w-screen h-screen">
      <div>
        <h1>{t("front.error.notfound")}</h1>
        <Link to="/">
          <p className='underline'>{t("front.error.back")}</p>
        </Link>
      </div>
    </div>
  );
}
