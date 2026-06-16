import React, { useState } from "react";
import { message } from "antd";
import { useTranslation } from "react-i18next";

export default function Newsletter() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      message.error(t("front.home.newsletterInvalid"));
      return;
    }
    message.success(t("front.home.newsletterSuccess"));
    setEmail("");
  };

  return (
    <section className="bg-surfacex-high py-12 md:py-16 mt-4">
      <div className="max-w-[1100px] mx-auto px-5 text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold text-inkx mb-3">
          {t("front.home.newsletterTitle")}
        </h2>
        <p className="text-inkx-variant max-w-xl mx-auto mb-7">
          {t("front.home.newsletterDesc")}
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 justify-center items-stretch max-w-lg mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("front.home.newsletterPlaceholder")}
            className="flex-grow px-5 py-3 rounded-lg border border-gray-300 bg-white outline-none focus:ring-2 focus:ring-brand text-inkx"
          />
          <button
            type="submit"
            className="bg-brand hover:bg-brand-dark text-white font-semibold px-7 py-3 rounded-lg shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            {t("front.home.newsletterButton")}
          </button>
        </form>
      </div>
    </section>
  );
}
