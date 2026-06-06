import React from 'react';
import { Row, Col, Checkbox, Card, Collapse } from 'antd';
import CommonForm from "components/commonForm";
import AgeGroupList from './ageGroupList';
import AgeGroupCalculator from './ageGroupCalculator';
import { useTranslation } from 'react-i18next';

const AgeGroups = ({ form, eventName }) => {
  const { t } = useTranslation();
  const isMaleGroup = CommonForm.useWatch(["eventTypes", eventName, "isMaleGroup"], form);
  const isFemaleGroup = CommonForm.useWatch(["eventTypes", eventName, "isFemaleGroup"], form);

  const itemsMale = [
    {
      key: '1',
      label: t("back.event.form.maleAgeGroup"),
      children: <>
        <AgeGroupCalculator
          gender="male"
          form={form}
          eventName={eventName}
          label={t("back.event.form.maleAgeGroup")}
          fieldPrefix="male"
        />
        <AgeGroupList form={form} eventName={eventName} name="maleAgeGroups" />
      </>
    }
  ];
  const itemsFemale = [
    {
      key: '1',
      label: t("back.event.form.femaleAgeGroup"),
      children: <>
        <AgeGroupCalculator
          gender="female"
          form={form}
          eventName={eventName}
          label={t("back.event.form.femaleAgeGroup")}
          fieldPrefix="female"
        />
        <AgeGroupList form={form} eventName={eventName} name="femaleAgeGroups" />
      </>
    }
  ];

  return (
    <>
      <Row gutter={{ xs: 2, md: 8 }}>
        <Col xs={24}>
          <CommonForm.Item
            name={[eventName, "isMaleGroup"]}
            valuePropName="checked"
          >
            <Checkbox
              className='!flex !items-center'
              onChange={(e) => {
                if (!e.target.checked) {
                  form.setFieldsValue({
                    eventTypes: {
                      [eventName]: {
                        maleAgeGroups: [],
                        maleMinAge: undefined,
                        maleMaxAge: undefined,
                        maleAgeRange: undefined,
                      },
                    },
                  });
                }
              }}
            >
              {t("back.event.form.addMaleAgeGroup")}
            </Checkbox>
          </CommonForm.Item>
        </Col>
      </Row>
      {
        isMaleGroup && (
          <Collapse className='mb-3' items={itemsMale} defaultActiveKey={["1"]} />
        )
      }
      <Row gutter={{ xs: 2, md: 8 }}>
        <Col xs={24}>
          <CommonForm.Item
            name={[eventName, "isFemaleGroup"]}
            valuePropName="checked"
          >
            <Checkbox
              className='!flex !items-center'
              onChange={(e) => {
                if (!e.target.checked) {
                  form.setFieldsValue({
                    eventTypes: {
                      [eventName]: {
                        femaleAgeGroups: [],
                        femaleMinAge: undefined,
                        femaleMaxAge: undefined,
                        femaleAgeRange: undefined,
                      },
                    },
                  });
                }
              }}
            >
              {t("back.event.form.addFemaleAgeGroup")}
            </Checkbox>
          </CommonForm.Item>
        </Col>
      </Row>
      {
        isFemaleGroup && (
          <Collapse items={itemsFemale} defaultActiveKey={["1"]} />
        )
      }
    </>
  );
};

export default AgeGroups;

