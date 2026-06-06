import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const useLanguageValidation = (form) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!form || !form.getFieldsError) return;

    const errorFields = form
      .getFieldsError()
      .filter(({ errors }) => errors.length)
      .map(({ name }) => name);

    if (errorFields.length > 0) {
      form.validateFields(errorFields).catch(() => {});
    }
  }, [i18n.language, form]);
};

export default useLanguageValidation;
