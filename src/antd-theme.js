import { COLOR } from "./constants/color";

export const antdTheme = {
  token: {
    colorPrimary: COLOR.primary,
    colorInfo: COLOR.primary,
    borderRadius: 4,
    // antd falls back to the system font otherwise (Tags, Tables… looked unlike the rest of the site).
    fontFamily: '"Kanit", sans-serif',
  },

  components: {
    Form: {
      itemMarginBottom: 12
    },
  },
};
