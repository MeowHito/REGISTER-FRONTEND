import React from 'react';
import { Button, Row, Col, Popover, Tag, Tooltip } from 'antd';
import CommonForm from "components/commonForm";
import { ArrowDownOutlined, ArrowUpOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import FloatingLabel from 'components/floatingLabel';
import { useTranslation } from 'react-i18next';

/**
 * Sizes of one shirt style. Rows can be moved up/down so a size can be inserted anywhere
 * without renaming the others (renaming would silently change the size of everyone who
 * already picked it — the badge shows how many people that is).
 */
const ShirtSizes = ({ form, shirtName }) => {
  const { t } = useTranslation();
  const sizes = CommonForm.useWatch(["shirtTypes", shirtName, "shirtSizes"], form) || [];

  const last = sizes[sizes.length - 1];
  const isAddDisabled = sizes.length > 0 && !last?.name;

  return (
    <CommonForm.List name={[shirtName, 'shirtSizes']}>
      {(optionFields, { add, remove, move }) => (
        <>
          {optionFields.map(({ key, name, ...restField }, index) => {
            const used = Number(sizes?.[name]?.usedCount || 0);
            return (
              <Row gutter={{ xs: 2, md: 8 }} key={key} align="top">
                <Col xs={4} md={2} className='text-right mt-2'>
                  {index + 1}.
                </Col>
                <Col xs={20} md={7}>
                  <CommonForm.Item
                    {...restField}
                    name={[name, 'name']}
                    className="mb-2"
                    rules={[{ required: true, message: t('required.shirtSizeName') }]}
                    extra={used > 0 ? (
                      <Tooltip title={t('back.event.form.shirtSizeRenameWarn', { count: used })}>
                        <Tag color="orange" className="!mt-1 !mr-0 !rounded-full">
                          {t('back.event.form.shirtSizeUsed', { count: used })}
                        </Tag>
                      </Tooltip>
                    ) : null}
                  >
                    <FloatingLabel label={t('back.event.form.shirtSizeName')} required />
                  </CommonForm.Item>
                </Col>
                <Col xs={12} md={5}>
                  <CommonForm.Item {...restField} name={[name, 'chestSize']} className="mb-2">
                    <FloatingLabel type="number" label={t('back.event.form.chestSize')} />
                  </CommonForm.Item>
                </Col>
                <Col xs={12} md={5}>
                  <CommonForm.Item {...restField} name={[name, 'lengthSize']} className="mb-2">
                    <FloatingLabel type="number" label={t('back.event.form.lengthSize')} />
                  </CommonForm.Item>
                </Col>
                <Col xs={24} md={5} className='mt-1 flex gap-1 justify-end md:justify-start'>
                  <Tooltip title={t('back.event.form.moveUp')}>
                    <Button size="small" icon={<ArrowUpOutlined />} disabled={index === 0}
                      onClick={() => move(index, index - 1)} />
                  </Tooltip>
                  <Tooltip title={t('back.event.form.moveDown')}>
                    <Button size="small" icon={<ArrowDownOutlined />} disabled={index === optionFields.length - 1}
                      onClick={() => move(index, index + 1)} />
                  </Tooltip>
                  <Popover content={used > 0 ? t('back.event.form.shirtSizeDeleteBlocked') : t('general.buttonDelete')}>
                    <Button size="small" danger icon={<CloseOutlined />} disabled={used > 0}
                      onClick={() => remove(name)} />
                  </Popover>
                </Col>
              </Row>
            );
          })}
          <Col xs={24} md={20} className='mx-auto text-center'>
            <Button block icon={<PlusOutlined />} type="dashed" onClick={() => add({})} disabled={isAddDisabled}>
              {t('back.event.form.addShirtSize')}
            </Button>
          </Col>
        </>
      )}
    </CommonForm.List>
  );
};

export default ShirtSizes;
