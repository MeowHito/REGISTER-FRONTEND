import { message } from "antd";

/**
 * A notice in the middle of the screen. antd's default spot is the very top, where on a phone it
 * sat on the header and was easy to miss; here it is larger and centred, so the runner sees what
 * still needs doing. The look lives under `.reg-center-notice` in index.css.
 */
export const centerNotice = (type, content, { at = "center" } = {}) =>
  message.open({
    type,
    content,
    duration: 3,
    className: "reg-center-notice",
    // "bottom" sits just above the fixed total bar: for warnings that scroll the thing to fix to the
    // top of the screen, where a mid-screen notice would cover it (a tall add-on card on a short phone).
    style: { marginTop: at === "bottom" ? "calc(100dvh - 168px)" : "calc(42vh - 40px)" },
  });
