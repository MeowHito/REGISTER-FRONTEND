import React, { useMemo } from 'react';
import { Button, Row, Col, Card, Popover } from 'antd';
import CommonForm from "components/commonForm";
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import FloatingLabel from 'components/floatingLabel';
import DraggableFormItem from 'components/draggableFormItem';
import { useTranslation } from 'react-i18next';

const AgeGroupList = ({ form, name, eventName }) => {
  const { t } = useTranslation();
  const eventTypes = CommonForm.useWatch("eventTypes", form) || [];

  const isAddDisabled = useMemo(() => {
    const ageGroups = eventTypes?.[eventName]?.[name] || [];
    const isEmpty = ageGroups.findIndex(
      (e) => (e?.minAge !== 0 && !e?.minAge) && (!e?.maxAge && e?.maxAge !== 0)
    ) !== -1;
    return eventTypes.length > 0 && ageGroups.length > 0 && isEmpty;
  }, [eventTypes]);

  const checkAgeOverlap = (currentIndex, minAge, maxAge) => {
    const ageGroups = eventTypes?.[eventName]?.[name] || [];
    for (let i = 0; i < ageGroups.length; i++) {
      if (i === currentIndex) continue;
      const group = ageGroups[i];
      if (group?.minAge === undefined || group?.maxAge === undefined) continue;
      if (minAge === undefined || maxAge === undefined) continue;

      const groupMin = Number(group.minAge);
      const groupMax = Number(group.maxAge);
      const currentMin = Number(minAge);
      const currentMax = Number(maxAge);

      if (currentMin <= groupMax && currentMax >= groupMin) {
        return true;
      }
    }
    return false;
  };

  const hasOverlap = (index) => {
    const ageGroups = eventTypes?.[eventName]?.[name] || [];
    const current = ageGroups[index];
    if (current?.minAge === undefined || current.maxAge === undefined) return false;
    return checkAgeOverlap(index, current.minAge, current.maxAge);
  };

  return (
    <CommonForm.List name={[eventName, name]}>
      {(fields, { add, remove, move }) => (
        <Card size="small" title={t("back.event.form.ageGroup")}>
          {fields.map(({ key, name: fieldName, ...restField }, index) => {
            const isOverlapping = hasOverlap(index);
            return (
              <DraggableFormItem key={key} index={index} move={move}>
                <CommonForm.Item
                  {...restField}
                  validateStatus={isOverlapping ? "error" : undefined}
                  help={isOverlapping ? <div className="-ml-6 -mt-2 mb-2 text-center">{t("validation.ageGroupOverlap")}</div> : undefined}
                >
                  <Row gutter={{ xs: 2, md: 8 }} align="middle" className="justify-center">
                    <Col xs={11} md={4}>
                      <CommonForm.Item
                        {...restField}
                        name={[fieldName, "minAge"]}
                        validateStatus={isOverlapping ? "error" : undefined}
                      >
                        <FloatingLabel
                          type="number"
                          size="large"
                          label={t("back.event.form.minAge")}
                        />
                      </CommonForm.Item>
                    </Col>
                    <Col xs={1} className="text-center">
                      -
                    </Col>
                    <Col xs={11} md={4}>
                      <CommonForm.Item
                        {...restField}
                        name={[fieldName, "maxAge"]}
                        validateStatus={isOverlapping ? "error" : undefined}
                        rules={[
                          {
                            validator: (_, value) => {
                              const minAge = form.getFieldValue(["eventTypes", eventName, name, fieldName, "minAge"]);
                              if (minAge !== undefined && value !== undefined && checkAgeOverlap(index, minAge, value)) {
                                return Promise.reject();
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}
                      >
                        <FloatingLabel
                          type="number"
                          size="large"
                          label={t("back.event.form.maxAge")}
                        />
                      </CommonForm.Item>
                    </Col>
                    <Col xs={1}>
                      <Popover content={t("back.event.form.delete")}>
                        <CloseOutlined onClick={() => remove(fieldName)} />
                      </Popover>
                    </Col>
                  </Row>
                </CommonForm.Item>

              </DraggableFormItem>
            );
          })}

          <Button
            type="dashed"
            onClick={() => add({ gender: name === "maleAgeGroups" ? "male" : "female" })}
            block
            icon={<PlusOutlined />}
            disabled={isAddDisabled}
          >
            {t("back.event.form.addAgeGroup")}
          </Button>
        </Card>
      )}
    </CommonForm.List>
  );
};

export default AgeGroupList;

