import React from 'react';
import { Row, Col, Checkbox } from 'antd';
import CommonForm from "components/commonForm";
import FloatingLabel from 'components/floatingLabel';
import { useTranslation } from 'react-i18next';

const Pricing = ({ form, eventName }) => {
  const { t } = useTranslation();
  const paymentTypes = CommonForm.useWatch("paymentTypes", form);

  return (
    <>
      <Row gutter={{ xs: 2, md: 8 }}>
        <Col xs={2}></Col>
        <Col xs={22} md={8}>
          <CommonForm.Item
            name={[eventName, "price"]}
            rules={[
              {
                required: true,
                message: t("required.basePrice"),
              },
            ]}
          >
            <FloatingLabel
              type="number"
              size="large"
              className="w-full"
              label={t("back.event.form.basePrice")}
              addonAfter={t("general.unitBaht")}
              required
            />
          </CommonForm.Item>
        </Col>
      </Row>

      <Row gutter={{ xs: 2, md: 8 }}>
        <Col xs={2} className='text-right'>
          <CommonForm.Item name={[eventName, "isNoShirt"]} valuePropName="checked">
            <Checkbox
              onChange={(e) => {
                if (!e.target.checked) {
                  form.setFieldValue(["eventTypes", eventName, "discountNoShirt"], undefined);
                }
              }}
            />
          </CommonForm.Item>
        </Col>
        <Col xs={22} md={8}>
          <CommonForm.Item
            shouldUpdate={(prev, curr) =>
              prev.eventTypes?.[eventName]?.isNoShirt !== curr.eventTypes?.[eventName]?.isNoShirt ||
              prev.eventTypes?.[eventName]?.price !== curr.eventTypes?.[eventName]?.price
            }
            noStyle
          >
            {() => {
              const basePrice = form.getFieldValue(["eventTypes", eventName, "price"]);
              return (
                <CommonForm.Item
                  name={[eventName, "discountNoShirt"]}
                  dependencies={[[eventName, "price"]]}
                  rules={[
                    {
                      required: !!form.getFieldValue(["eventTypes", eventName, "isNoShirt"]),
                      message: t("required.discountNoShirt"),
                    },
                    {
                      validator: (_, value) => {
                        if (!value || !basePrice) return Promise.resolve();
                        if (Number(value) > Number(basePrice)) {
                          return Promise.reject(new Error(t("validation.discountExceedsPrice")));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <FloatingLabel
                    type="number"
                    size="large"
                    className="w-full"
                    label={t("back.event.form.discountNoShirt")}
                    addonAfter={t("general.unitBaht")}
                    disabled={!form.getFieldValue(["eventTypes", eventName, "isNoShirt"])}
                  />
                </CommonForm.Item>
              );
            }}
          </CommonForm.Item>
        </Col>
      </Row>

      <CommonForm.List name={[eventName, "pricing"]}>
        {() => (
          <>
            {paymentTypes?.map((pay, subIndex) => (
              <Row key={pay.id || pay.name} gutter={{ xs: 2, md: 8 }}>
                <Col xs={2} className="text-right">
                  <CommonForm.Item name={[subIndex, "paymentTypeId"]} hidden>
                    <input />
                  </CommonForm.Item>
                  <CommonForm.Item name={[subIndex, "selected"]} valuePropName="checked">
                    <Checkbox
                      onChange={(e) => {
                        if (!e.target.checked) {
                          form.setFieldsValue({
                            eventTypes: {
                              [eventName]: {
                                pricing: {
                                  [subIndex]: {
                                    price: undefined,
                                    quota: undefined
                                  }
                                }
                              },
                            },
                          });
                        } else {
                          form.setFieldsValue({
                            eventTypes: {
                              [eventName]: {
                                pricing: {
                                  [subIndex]: {
                                    selected: true,
                                    paymentTypeId: pay.id
                                  }
                                }
                              }
                            }
                          })
                        }
                      }}
                    />
                  </CommonForm.Item>
                </Col>

                <Col xs={12} md={8}>
                  <CommonForm.Item
                    shouldUpdate={(prev, curr) =>
                      prev.eventTypes?.[eventName]?.pricing?.[subIndex]?.selected !==
                      curr.eventTypes?.[eventName]?.pricing?.[subIndex]?.selected
                    }
                    noStyle
                  >
                    {() => {
                      const isChecked = form.getFieldValue(["eventTypes", eventName, "pricing", subIndex, "selected"]);
                      return (
                        <CommonForm.Item
                          name={[subIndex, "price"]}
                          rules={[
                            {
                              required: isChecked,
                              message: t("required.pricingPrice", { name: pay.name || "" }),
                            },
                          ]}
                        >
                          <FloatingLabel
                            type="number"
                            size="large"
                            className="w-full"
                            label={t("back.event.form.pricingPrice", { name: pay.name || "" })}
                            addonAfter={t("general.unitBaht")}
                            disabled={!isChecked}
                            required={isChecked}
                          />
                        </CommonForm.Item>
                      );
                    }}
                  </CommonForm.Item>
                </Col>

                <Col xs={10} md={8}>
                  <CommonForm.Item
                    shouldUpdate={(prev, curr) =>
                      prev.eventTypes?.[eventName]?.pricing?.[subIndex]?.selected !==
                      curr.eventTypes?.[eventName]?.pricing?.[subIndex]?.selected ||
                      prev.eventTypes?.[eventName]?.quota !== curr.eventTypes?.[eventName]?.quota ||
                      prev.eventTypes?.[eventName]?.pricing !== curr.eventTypes?.[eventName]?.pricing
                    }
                    noStyle
                  >
                    {() => {
                      const isChecked = form.getFieldValue(["eventTypes", eventName, "pricing", subIndex, "selected"]);
                      const eventTypeQuota = form.getFieldValue(["eventTypes", eventName, "quota"]) || 0;

                      return (
                        <CommonForm.Item
                          name={[subIndex, "quota"]}
                          rules={[
                            {
                              required: isChecked,
                              message: t("required.pricingQuota"),
                            },
                            {
                              validator: (_, value) => {
                                if (!isChecked || !value) return Promise.resolve();

                                const pricing = form.getFieldValue(["eventTypes", eventName, "pricing"]) || [];
                                const totalPricingQuota = pricing
                                  .filter((p, idx) => p?.selected && idx !== subIndex)
                                  .reduce((sum, p) => sum + (Number(p?.quota) || 0), 0) + (Number(value) || 0);

                                if (totalPricingQuota > eventTypeQuota) {
                                  return Promise.reject(
                                    new Error(t("validation.pricingQuotaExceed", {
                                      total: totalPricingQuota,
                                      max: eventTypeQuota
                                    }))
                                  );
                                }
                                return Promise.resolve();
                              }
                            }
                          ]}
                        >
                          <FloatingLabel
                            type="number"
                            size="large"
                            className="w-full"
                            label={t("back.event.form.pricingQuota")}
                            disabled={!isChecked}
                            required={isChecked}
                            min={1}
                            max={eventTypeQuota}
                          />
                        </CommonForm.Item>
                      );
                    }}
                  </CommonForm.Item>
                </Col>
              </Row>
            ))}
          </>
        )}
      </CommonForm.List>
    </>
  );
};

export default Pricing;

