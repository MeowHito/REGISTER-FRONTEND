import React, { useCallback } from 'react';
import { Form as AntdForm } from 'antd';
import useLanguageValidation from 'hooks/useLanguageValidation';

const CommonForm = (props) => {
  const { form, children, onFinishFailed, ...rest } = props;
  const [internalForm] = AntdForm.useForm();
  const formInstance = form || internalForm;

  useLanguageValidation(formInstance);

  const handleFinishFailed = useCallback((errorInfo) => {
    if (onFinishFailed) {
      onFinishFailed(errorInfo);
    }

    if (errorInfo?.errorFields?.length > 0) {
      const firstErrorField = errorInfo.errorFields[0];
      const fieldName = firstErrorField.name;

      setTimeout(() => {
        let element = null;

        const selectors = [
          `[id="${Array.isArray(fieldName) ? fieldName.join('_') : fieldName}"]`,
          `[name="${Array.isArray(fieldName) ? fieldName.join('.') : fieldName}"]`,
          `.ant-form-item-has-error input`,
          `.ant-form-item-has-error select`,
          `.ant-form-item-has-error textarea`,
          `.ant-form-item-has-error .ant-select-selector`,
        ];

        for (const selector of selectors) {
          element = document.querySelector(selector);
          if (element) break;
        }

        if (element) {
          const formItem = element.closest('.ant-form-item') || element;
          
          formItem.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });

          setTimeout(() => {
            if (element.focus) {
              element.focus();
            }
          }, 300);
        }
      }, 100);
    }
  }, [onFinishFailed]);

  return (
    <AntdForm
      scrollToFirstError={{ behavior: "smooth", block: "center" }}
      form={formInstance}
      onFinishFailed={handleFinishFailed}
      {...rest}
    >
      {children}
    </AntdForm>
  );
};

Object.keys(AntdForm).forEach((key) => {
  CommonForm[key] = AntdForm[key];
});

export default CommonForm;
