import { useEffect, useState } from "react";
import { Modal, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import createRequest from "utils/request";
import _ from "lodash";
import useUploadFileHook from "hooks/useUploadFileHook";
import { dummyRequest } from "hooks/dummyRequest";
import { useTranslation } from "react-i18next";

const ImageUpload = ({
  id,
  label,
  isEditable = true,
  filename,
  prefix,
  uploadText,
  hooks,
  options,
  alt,
  required = false,
  value,
  onChange,
  ...other
}) => {
  const selfhooks = useUploadFileHook(options);
  const { t } = useTranslation();
  const activeHooks = hooks || selfhooks;
  const [initialized, setInitialized] = useState(false);

  const {
    fileList,
    previewImage,
    previewOpen,
    handlePreview,
    handleChange,
    handleCancel,
    setFileList,
  } = activeHooks;

  useEffect(() => {
    if (value !== undefined && Array.isArray(value)) {
      setFileList(value);
    }
  }, [value]);

  useEffect(() => {
    const fetchPreview = async () => {
      if (typeof filename === "string" && filename && prefix && !initialized) {
        const { data } = await createRequest.get("/public-api/getPublicUrl", {
          params: { key: filename, prefix },
        });
        const newFileList = [{
          uid: "-preview",
          name: filename,
          status: "done",
          url: data.data,
          isPreview: true,
        }];
        handleChange({ fileList: newFileList });
        if (onChange) {
          onChange(newFileList);
        }
        setInitialized(true);
      }
    };
    fetchPreview();
  }, [filename, prefix]);

  const onUploadChange = (info) => {
    handleChange(info);
    if (onChange) {
      onChange(info.fileList);
    }
  };

  return (
    <>
      <div id={id} className="flex flex-col items-center px-2">
        {label && (
          <p className="self-start mb-2">
            {required && <span className="text-red-500 mr-1">*</span>}
            {label}
          </p>
        )}
        <Upload
          customRequest={dummyRequest}
          fileList={fileList}
          onPreview={handlePreview}
          onChange={onUploadChange}
          disabled={!isEditable}
          accept="image/png, image/jpeg"
          listType="picture-card"
          maxCount={1}
          {...other}
        >
          {isEditable && fileList.length === 0 && (
            <div>
              <UploadOutlined size={20} className="mb-2" />
              <p>{uploadText ?? t("general.uploadImg")}</p>
            </div>
          )}
        </Upload>
        {alt && <i className="text-xs text-gray-500 mb-2">{alt}</i>}
      </div>
      <Modal open={previewOpen} footer={null} onCancel={handleCancel}>
        <img
          alt="preview-img"
          style={{ width: "100%" }}
          src={previewImage}
        />
      </Modal>
    </>
  );
};

export default ImageUpload;