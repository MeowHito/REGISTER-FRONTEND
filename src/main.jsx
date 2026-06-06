import { createRoot } from 'react-dom/client'

import { ConfigProvider } from "antd";
import Preloader from "components/preLoader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import "slick-carousel/slick/slick-theme.css";
import "slick-carousel/slick/slick.css";
import App from "./App";
import { antdTheme } from "./antd-theme";
import dayjs from "dayjs";
import duration from 'dayjs/plugin/duration';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isBetween from "dayjs/plugin/isBetween";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import buddhistEra from "dayjs/plugin/buddhistEra";
import "dayjs/locale/th";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import '@ant-design/v5-patch-for-react-19';
import "./index.css";
import { PersistGate } from 'redux-persist/integration/react';
import configureStore from 'store';

const { store, persistor } = configureStore()

dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(buddhistEra);

const queryClient = new QueryClient();
createRoot(document.getElementById('root')).render(
  <ConfigProvider theme={antdTheme}>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <Preloader />
        <GoogleOAuthProvider clientId={import.meta.env.VITE_AUTH_GOOGLE_ID}>
          <DndProvider backend={HTML5Backend}>
            {/* <StyleProvider  hashPriority="high"> */}
            <PersistGate loading={null} persistor={persistor}>
              <App />
            </PersistGate>
            {/* </StyleProvider> */}
          </DndProvider>
        </GoogleOAuthProvider>
      </Provider>
    </QueryClientProvider>
  </ConfigProvider>
  ,
)
