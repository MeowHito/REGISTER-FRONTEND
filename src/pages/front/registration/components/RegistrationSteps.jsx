import React, { useEffect, useState } from "react";
import { Steps, Tag } from "antd";
import { useTranslation } from "react-i18next";

const { Step } = Steps;

const stepKeys = ["fill", "review", "payment", "success"];

const RegistrationSteps = ({ currentStep }) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  const stepTitles = stepKeys.map((key) => t(`back.reg.step.${key}`));

  useEffect(() => {
    const checkMobile = () => setIsMobile(globalThis.innerWidth <= 768);
    checkMobile();
    globalThis.addEventListener("resize", checkMobile);
    return () => globalThis.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="pt-4 md:!max-w-screen-lg !mx-auto">
      {isMobile ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <Tag
            color="blue"
            style={{
              fontSize: "18px",
              fontWeight: "550",
              fontFamily: "inherit",
              padding: "4px 10px",
              borderRadius: "12px",
            }}
          >
            {t("back.reg.step.no")} {currentStep + 1} : {stepTitles[currentStep]}
          </Tag>
        </div>
      ) : (
        <Steps current={currentStep} style={{ marginBottom: "24px" }}>
          {stepTitles.map((title, index) => (
            <Step key={index} title={title} />
          ))}
        </Steps>
      )}
    </div>
  );
};

export default RegistrationSteps;
