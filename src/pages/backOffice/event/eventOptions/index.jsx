import { Button, Card, Row, Col, Popover } from "antd";
import CommonForm from "components/commonForm";
import { CloseOutlined, PlusOutlined } from "@ant-design/icons";
import FloatingLabel from "components/floatingLabel";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useWatch } from "antd/es/form/Form";

const EventOptions = ({ form, fieldName = [] }) => {
  const { t } = useTranslation();
  const namePath = [fieldName[fieldName.length - 1], "options"];
  const options = useWatch(fieldName.length > 2 ? ["eventTypes", ...fieldName, "options"] : [...fieldName, "options"], form) || [];
  const isAddDisabled = useMemo(() => {
    const last = options[options?.length - 1];

    if (last?.inputType === "FREE_TEXT") {
      return false;
    }

    return (
      options.length > 0 &&
      (!last?.value)
    );
  }, [options]);

  return (
    <CommonForm.List name={namePath}>
      {(optFields, { add, remove }) => (
        <>
          {optFields.map(({ key, name }) => {
            const currentOption = options?.[name];
            const isFreeText = currentOption?.inputType === "FREE_TEXT";

            return (
              <Card
                key={`event-options-${key}`}
                className="!mb-3"
                size="small"
                title={t("back.event.form.answer", { number: name + 1 })}
                extra={
                  <Popover content={t("general.buttonDelete")}>
                    <CloseOutlined onClick={() => remove(name)} />
                  </Popover>
                }
              >
                <Row gutter={8} align="middle" className="mb-2">
                  <Col xs={24}>
                    <CommonForm.Item
                      name={[name, "inputType"]}
                    >
                      <FloatingLabel
                        type="select"
                        label={t("back.event.form.answerType")}
                        options={[
                          { label: t("back.event.form.fixedValue"), value: "FIXED" },
                          { label: t("back.event.form.freeText"), value: "FREE_TEXT" },
                        ]}
                        allowClear={false}
                      />
                    </CommonForm.Item>
                  </Col>
                </Row>
                {!isFreeText && (
                  <Row gutter={8} align="middle" className="mb-2">
                    <Col xs={12}>
                      <CommonForm.Item
                        name={[name, "value"]}
                        rules={[{ required: true, message: t("required.optionValue") }]}
                      >
                        <FloatingLabel label={t("back.event.form.option")} required />
                      </CommonForm.Item>
                    </Col>
                    <Col xs={12}>
                      <CommonForm.Item name={[name, "valueEn"]}>
                        <FloatingLabel label={t("back.event.form.optionEn")} />
                      </CommonForm.Item>
                    </Col>
                  </Row>
                )}
                {isFreeText && (
                  <Row gutter={8} align="middle" className="mb-2">
                    <Col xs={12}>
                      <CommonForm.Item name={[name, "value"]}>
                        <FloatingLabel label={t("back.event.form.placeholder")} />
                      </CommonForm.Item>
                    </Col>
                    <Col xs={12}>
                      <CommonForm.Item name={[name, "valueEn"]}>
                        <FloatingLabel label={t("back.event.form.placeholderEn")} />
                      </CommonForm.Item>
                    </Col>
                  </Row>
                )}
              </Card>
            );
          })}
          <CommonForm.Item>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => add({ inputType: "FIXED" })}
              disabled={isAddDisabled}
              block
            >
              {t("back.event.form.addOption")}
            </Button>
          </CommonForm.Item>
        </>
      )}
    </CommonForm.List>
  );
};

export default EventOptions;

