import _ from "lodash";

export const getFileNameFromUrl = (url) => {
  const path = url.split("/");
  const fileNameWithQuery = path[_.size(path) - 1];
  const fileName = fileNameWithQuery.split("?")[0];
  return fileName;
};
