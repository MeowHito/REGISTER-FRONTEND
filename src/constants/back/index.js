import { BarcodeOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { ROLE_USER } from "constants/role";

const STAFF_PATH = ROLE_USER.STAFF;

const STAFF_MENU = [
  {
    id: 1,
    title: "scanCode",
    name: "สแกนบาร์โค้ด",
    icon: <BarcodeOutlined />,
    path: `/${STAFF_PATH}/scanCode`,
    disabled: false,
  },
  {
    id: 2,
    title: "historyScan",
    name: "ประวัติการสแกน",
    icon: <UnorderedListOutlined />,
    path: `/${STAFF_PATH}/historyScan`,
    disabled: false,
  },
];

export { STAFF_MENU }