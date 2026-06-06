export const errorToMessage = (err) => {
  let msg = err?.response?.data?.status?.description;
  return `${msg || err}`;
};
