import { courseTypeOption } from "constants/options/courseTypeOption";
import _ from "lodash";

export const courseTypeToText = (type) => {
  let _type = _.find(courseTypeOption, (n) => n.value === type);
  return _type?.label;
};
