import dayjs from "dayjs";

export const disabledDate = (current) => {
  return current && current < dayjs().endOf("day");
};
