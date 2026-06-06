import React from 'react';
import { Row, Col, Popover, Card, Form } from 'antd';
import CommonForm from "components/commonForm";
import { PlusOutlined } from '@ant-design/icons';
import FloatingLabel from 'components/floatingLabel';
import { useTranslation } from 'react-i18next';

const AgeGroupCalculator = ({ gender, form, eventName, fieldPrefix }) => {
  const { t } = useTranslation();

  const minAge = Form.useWatch(["eventTypes", eventName, `${fieldPrefix}MinAge`], form) ?? 0;
  const maxAge = Form.useWatch(["eventTypes", eventName, `${fieldPrefix}MaxAge`], form) ?? 0;
  const ageRange = Form.useWatch(["eventTypes", eventName, `${fieldPrefix}AgeRange`], form) ?? 0;

  const canGenerate = minAge < maxAge && ageRange > 0;

  const calculateAgeGroup = () => {
    if (!canGenerate) return;

    const ageGroups = [];

    for (let start = minAge; start <= maxAge; start += ageRange) {
      const end = Math.min(start + ageRange - 1, maxAge);
      ageGroups.push({ gender, minAge: start, maxAge: end });
    }

    form.setFieldValue(
      ["eventTypes", eventName, gender === "male" ? "maleAgeGroups" : "femaleAgeGroups"],
      ageGroups
    );
  };

  return (
    <Card className='mb-3' size="small" title={t("back.event.form.ageGroupToolTitle")}>
      <Row gutter={{ xs: 2, md: 8 }} align="start">
        <Col xs={11} md={4}>
          <CommonForm.Item name={[eventName, `${fieldPrefix}MinAge`]}>
            <FloatingLabel type="number" size="large" label={t("back.event.form.minAge")} min={0} />
          </CommonForm.Item>
        </Col>
        <Col xs={0.5} className='flex items-center'>
          <CommonForm.Item>-</CommonForm.Item>
        </Col>
        <Col xs={11} md={4}>
          <CommonForm.Item name={[eventName, `${fieldPrefix}MaxAge`]}>
            <FloatingLabel type="number" size="large" label={t("back.event.form.maxAge")} min={0} />
          </CommonForm.Item>
        </Col>
        <Col xs={20} md={4}>
          <CommonForm.Item name={[eventName, `${fieldPrefix}AgeRange`]}>
            <FloatingLabel type="number" size="large" label={t("back.event.form.ageRange")} min={0} />
          </CommonForm.Item>
        </Col>
        <Col xs={2} md={1} className='text-center mt-2 ml-3 md:ml-0'>
          <Popover content={canGenerate ? t("back.event.form.addAgeGroup") : t("required.all")}>
            <PlusOutlined
              style={{ cursor: canGenerate ? 'pointer' : 'not-allowed', color: canGenerate ? undefined : '#ccc' }}
              onClick={calculateAgeGroup}
            />
          </Popover>
        </Col>
      </Row>
    </Card>
  );
};

export default AgeGroupCalculator;

