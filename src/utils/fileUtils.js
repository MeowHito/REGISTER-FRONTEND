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


export const checkAndUploadImg = async (html, prefix, { isPublic = false } = {}) => {
    const imgTagPattern = /<img[^>]+src="([^">]+)"/g;
    const matches = [...html.matchAll(imgTagPattern)];

    let updatedHtml = html;

    for (const match of matches) {
        const fullMatch = match[0];
        const src = match[1];

        if (src.startsWith("data:image")) {
            const file = dataURLtoFile(src, `image-${Date.now()}.png`);
            const filename = await onUploadFile({ prefix, isPublic, fileList: [{ originFileObj: file }] });
            updatedHtml = updatedHtml.replace(fullMatch, `<img src="{$img ${filename}}"`);
        } else if (src.includes("amazonaws.com")) {
            const filename = src.split("/").pop().split("?")[0];
            updatedHtml = updatedHtml.replace(fullMatch, `<img src="{$img ${filename}}"`);
        }
    }

    return updatedHtml;
};

export const usePublicImageUrl = ({ key, prefix = "event", isPublic = false }) => {
    return useQuery({
        queryKey: ["publicUrl", prefix, key],
        queryFn: async () => {
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
    const { data } = await createRequest.get("/public-api/getPublicUrl", {
        params: { key, prefix, isPublic },
    });
    return data.data;
};

export async function getImageFileToUpload({
    fileList,
    prefix,
    oldKey,
    isPublic = false
}) {
    const actualOldKey = oldKey || null;

    const newFileList = (fileList || []).filter(
        (f) => !f.isPreview && f.status === "done" && f.originFileObj
    );

    if (newFileList.length > 0) {
        return await onUploadFile({ prefix, isPublic, fileList: newFileList });
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