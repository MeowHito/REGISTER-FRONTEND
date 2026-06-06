import React, { useMemo } from 'react';
import { Button, Row, Col, Popover } from 'antd';
import CommonForm from "components/commonForm";
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import FloatingLabel from 'components/floatingLabel';
import { useTranslation } from 'react-i18next';

const ShirtSizes = ({ form, shirtName }) => {
  const { t } = useTranslation();
  const eventTypes = CommonForm.useWatch("eventTypes", form) || [];

  const isAddDisabled = useMemo(() => {
    const shirtSizes = eventTypes?.shirtTypes?.[shirtName]?.shirtSizes || [];
    const last = shirtSizes[shirtSizes?.length - 1];

    return (
      eventTypes.length > 0 && shirtSizes.length > 0 &&
      (!last?.name)
    );
  }, [eventTypes]);

  return (
    <CommonForm.List name={[shirtName, 'shirtSizes']}>
      {(optionFields, { add, remove }) => (
        <>
          {optionFields.map(({ key, name, ...restField }, index) => (
            <Row gutter={{ xs: 2, md: 8 }} key={key}>
              <Col xs={0} md={2} className='text-right mt-2'>
                {index + 1}.
              </Col>
              <Col xs={24} md={8}>
                <CommonForm.Item
                  {...restField}
                  name={[name, 'name']}
                  className="mb-2"
                  rules={[
                    {
                      required: true,
                      message: t('required.shirtSizeName'),
                    },
                  ]}
                >
                  <FloatingLabel
                    label={t('back.event.form.shirtSizeName')}
                    required
                  />
                </CommonForm.Item>
              </Col>
              <Col xs={24} md={6}>
                <CommonForm.Item
                  {...restField}
                  name={[name, 'chestSize']}
                  className="mb-2"
                >
                  <FloatingLabel
                    type="number"
                    label={t('back.event.form.chestSize')}
                  />
                </CommonForm.Item>
              </Col>
              <Col xs={20} md={6}>
                <CommonForm.Item
                  {...restField}
                  name={[name, 'lengthSize']}
                  className="mb-2"
                >
                  <FloatingLabel
                    type="number"
                    label={t('back.event.form.lengthSize')}
                  />
                </CommonForm.Item>
              </Col>
              <Col xs={2} md={1} className='text-left mt-2'>
                <Popover content={t('general.buttonDelete')}>
                  <CloseOutlined
                    onClick={() => {
                      remove(name);
                    }}
                  />
                </Popover>
              </Col>
            </Row>
          ))}
          <Col xs={24} md={20} className='mx-auto text-center'>
            <Button
              block
              icon={<PlusOutlined />}
              type="dashed"
              onClick={() => add()}
              disabled={isAddDisabled}
            >
              {t('back.event.form.addShirtSize')}
            </Button>
          </Col>
        </>
      )}
    </CommonForm.List>
  );
};

export default ShirtSizes;

