import { message } from "antd";

/**
 * A notice in the middle of the screen. antd's default spot is the very top, where on a phone it
 * sat on the header and was easy to miss; here it is larger and centred, so the runner sees what
 * still needs doing. The look lives under `.reg-center-notice` in index.css.
 */
export const centerNotice = (type, content) =>
  message.open({
    type,
    content,
    duration: 3,
    className: "reg-center-notice",
    style: { marginTop: "calc(42vh - 40px)" },
  });
