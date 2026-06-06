import { useState } from "react";

const getBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

const useUploadFileHook = ({
  fileList: controlledFileList,
  onChange: controlledOnChange,
  insidePreviewOpen,
  insideHandleCancel,
} = {}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [internalFileList, setInternalFileList] = useState([]);
  const [touched, setTouched] = useState(false);

  const fileList = controlledFileList ?? internalFileList;

  const handlePreview = async (file) => {
    if (insidePreviewOpen) {
      insidePreviewOpen();
    }
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
    setPreviewTitle(
      file.name || (file.url ? file.url.substring(file.url.lastIndexOf("/") + 1) : "")
    );
  };

  const handleChange = ({ fileList: newFileList }) => {
    if (controlledOnChange) {
      controlledOnChange(newFileList);
    } else {
      setInternalFileList(newFileList);
    }
  };

  const handleCancel = () => {
    if (insideHandleCancel) {
      insideHandleCancel();
    }
    setPreviewOpen(false);
  };

  return {
    previewOpen,
    previewImage,
    previewTitle,
    fileList,
    setFileList: setInternalFileList,
    handlePreview,
    handleChange,
    handleCancel,
    touched,
    setTouched,
  };
};

export default useUploadFileHook;
