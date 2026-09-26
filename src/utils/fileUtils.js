import { onUploadFile } from "hooks/onUploadFile";
import createRequest from "./request";
import { useQuery } from "@tanstack/react-query";

export const dataURLtoFile = (dataURL, fileName) => {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], fileName, { type: mime });
}

export const convertHtmlToStorage = (html) => {
    return html.replace(/<img[^>]+src="([^">]+)"/g, (match, src) => {
        const filename = src.split("/").pop().split("?")[0];
        return `{$img ${filename}}`;
    });
};

export const convertStorageToHtml = async (html, prefix, getPublicUrl) => {
    // Optional rich-text fields arrive as null/undefined; hand them back untouched
    // rather than blowing up on .matchAll().
    if (typeof html !== "string" || !html) return html;

    const pattern = /\{\$img ([^}]+)\}/g;
    const matches = [...html.matchAll(pattern)];

    const urlMap = await Promise.all(
        matches.map(async (match) => {
            const filename = match[1];
            const url = await getPublicUrl({ key: filename, prefix });
            return { filename, url };
        })
    );

    let resultHtml = html;
    for (const { filename, url } of urlMap) {
        resultHtml = resultHtml.replaceAll(`{$img ${filename}}`, url);
    }

    return resultHtml;
};


// Thrown when a file could not be uploaded, so the caller stops instead of saving
// an empty key over the old one. onUploadFile has already shown the error alert.
export class UploadFailedError extends Error {
    constructor() {
        super("upload failed");
        this.name = "UploadFailedError";
    }
}

export const checkAndUploadImg = async (html, prefix, { isPublic = false } = {}) => {
    // Same as above: an empty optional editor field is not an error.
    if (typeof html !== "string" || !html) return html;

    const imgTagPattern = /<img[^>]+src="([^">]+)"/g;
    const matches = [...html.matchAll(imgTagPattern)];

    let updatedHtml = html;

    for (const match of matches) {
        const fullMatch = match[0];
        const src = match[1];

        if (src.startsWith("data:image")) {
            const file = dataURLtoFile(src, `image-${Date.now()}.png`);
            const filename = await onUploadFile({ prefix, isPublic, fileList: [{ originFileObj: file }] });
            if (!filename) throw new UploadFailedError();
            updatedHtml = updatedHtml.replace(fullMatch, `<img src="{$img ${filename}}"`);
        } else if (src.includes("amazonaws.com")) {
            const filename = src.split("/").pop().split("?")[0];
            updatedHtml = updatedHtml.replace(fullMatch, `<img src="{$img ${filename}}"`);
        }
    }

    return updatedHtml;
};

// A stored image value may already be a full URL (e.g. seeded/imported events
// using https://placehold.co/... or any external link) instead of an S3 object
// key. In that case it must be used as-is — passing it through getPublicUrl would
// wrongly nest it under the S3 bucket path and 404 ("Image not available").
export const isAbsoluteUrl = (value) =>
    typeof value === "string" && /^(https?:)?\/\/|^(data|blob):/i.test(value.trim());

export const usePublicImageUrl = ({ key, prefix = "event", isPublic = false }) => {
    return useQuery({
        queryKey: ["publicUrl", prefix, key],
        queryFn: async () => {
            if (isAbsoluteUrl(key)) return key;
            const { data } = await createRequest.get("/public-api/getPublicUrl", {
                params: { key, prefix, isPublic },
            });
            return data.data;
        },
        staleTime: 1000 * 60 * 60,
        enabled: !!key && !!prefix,
    });
};

export const getPublicUrl = async ({ key, prefix, isPublic = false }) => {
    if (!key || !prefix) return null
    if (isAbsoluteUrl(key)) return key;
    const { data } = await createRequest.get("/public-api/getPublicUrl", {
        params: { key, prefix, isPublic },
    });
    return data.data;
};

export async function getImageFileToUpload({
    fileList,
    prefix,
    oldKey,
    isPublic = false,
    // true: throw UploadFailedError when the new file fails to upload, instead of returning undefined.
    strict = false,
}) {
    const actualOldKey = oldKey || null;

    const newFileList = (fileList || []).filter(
        (f) => !f.isPreview && f.status === "done" && f.originFileObj
    );

    if (newFileList.length > 0) {
        const key = await onUploadFile({ prefix, isPublic, fileList: newFileList });
        if (!key && strict) throw new UploadFailedError();
        return key;
    } else if (!fileList || fileList.length === 0) {
        return null;
    } else if (
        fileList.length === 1 &&
        (fileList[0].isPreview || fileList[0].uid === "-preview")
    ) {
        return actualOldKey;
    }
    return null;
}