import _ from "lodash";
import { readAndCompressImage } from "browser-image-resizer";
import {
  AlertClosed,
  AlertError,
  AlertLoading,
  AlertUpdateLoading,
} from "components/alert";
import createRequest from "utils/request";

const MAX_IMAGE_SIZE_MB = 5;
let _swalInstance = null;

const RESIZE_CONFIG = {
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1920,
  autoRotate: true,
};

export const onUploadFile = async ({
  prefix = "",
  fileList = [],
  showProgress = false,
  isPublic = false,
}) => {
  try {
    if (_.size(fileList) === 0) return;

    const rawFile =
      fileList[0]?.originFileObj || fileList[0];

    if (!rawFile) return;

    const isImage =
      rawFile.type === "image/jpeg" ||
      rawFile.type === "image/png" ||
      rawFile.type === "image/webp";

    console.log(`:: FILE SIZE : ${_.round(rawFile.size / 1024 / 1024, 2)} MB`);

    let fileToUpload = rawFile;

    if (isImage && rawFile.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      const resizedBlob = await readAndCompressImage(
        rawFile,
        RESIZE_CONFIG
      );

      const newName = rawFile.name;
      const type = (resizedBlob).type || rawFile.type || "image/jpeg";

      fileToUpload = new File([resizedBlob], newName, { type });

      console.log(
        `:: RE-SIZE : ${_.round(fileToUpload.size / 1024 / 1024, 2)} MB`
      );
    }

    _swalInstance = AlertLoading({ text: `กำลังอัปโหลดไฟล์...` });

    const formData = new FormData();
    formData.append("prefix", prefix);
    formData.append("isPublic", String(!!isPublic));
    formData.append("file", fileToUpload);

    const res = await createRequest.post(
      "/api/file/uploadFile",
      formData,
      {
        onUploadProgress: (e) => {
          const total = e?.total || 0;
          if (showProgress && total > 0) {
            const percent = Math.round((e.loaded * 100) / total);
            AlertUpdateLoading({ percent });
          }
        },
      }
    );

    const fileName = res?.data?.data;

    AlertClosed();
    _swalInstance = null;
    return fileName;
  } catch (error) {
    AlertClosed();
    _swalInstance = null;

    const serverMsg =
      error?.response?.data?.message ||
      error?.message ||
      "อัปโหลดไฟล์ไม่สำเร็จ";

    AlertError({
      title: "อัปโหลดไฟล์ไม่สำเร็จ!",
      text: serverMsg,
    });

    console.error("ERR : onUploadFile", error);
    return undefined;
  }
};
