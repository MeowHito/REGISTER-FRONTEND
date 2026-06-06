import MainLayout from 'layouts/mainLayout';
import './App.css';
import "./i18n";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from 'pages/front/home';
import Error from 'pages/front/error';
import Login from 'pages/backOffice/login';
import Register from 'pages/backOffice/register';
import Event from 'pages/front/event';
import Setting from 'pages/backOffice/setting';
import Forgot from 'pages/backOffice/forgot';
import ChangePassword from 'pages/backOffice/changepassword';
import BackOfficeLayout from 'components/backOfficeLayout';
import EventList from 'pages/backOffice/event/eventList';
import {
  RegistrationInfo,
  RegistrationDetail,
  RegistrationPayment,
  RegistrationPaymentConfirmation,
  RegistrationPaymentResult,
  RegistrationLink,
} from 'pages/front/registration';
import Dashboard from 'pages/backOffice/dashboard';
import ContractList from 'pages/backOffice/contract/contractList';
import AnnouncementList from 'pages/backOffice/announcement/announcementList';
import EventDetail from 'pages/front/eventDetail';
import EventCalendar from 'pages/front/eventCalendar';
import ParticipantSearch from 'pages/front/participantSearch';
import PaymentHistory from 'pages/backOffice/paymentHistory';
import CouponList from 'pages/backOffice/coupon/couponList';
import CouponDetails from 'pages/backOffice/coupon/couponDetails';
import TermsOfUse from 'pages/backOffice/termsOfUse';
import Contact from 'pages/front/contact';
import EventCalendarList from 'pages/backOffice/eventCalendar/eventCalendarList';
import EventCalendarDetails from 'pages/backOffice/eventCalendar/eventCalendarDetails';
import ParticipantList from 'pages/backOffice/event/participantList';
import ReportList from 'pages/backOffice/report';
import InviteAccept from 'pages/front/inviteAccept';
import Operations from 'pages/backOffice/operations';
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useEffect } from 'react';
import { ConfigProvider } from 'antd';
import thTH from 'antd/locale/th_TH';
import enUS from 'antd/locale/en_US';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    dayjs.locale(i18n.language);
  }, [i18n.language]);

  return (
    <ConfigProvider locale={i18n.language === 'th' ? thTH : enUS}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="contact" element={<Contact />} />
            <Route path="event" element={<Event />} />
            <Route path="eventCalendar" element={<EventCalendar />} />
            <Route path="eventDetail/:name" element={<EventDetail />} />
            <Route path="participantSearch/:eventId" element={<ParticipantSearch />} />
            <Route path="registrationInfo/:id" element={<RegistrationInfo />} />
            <Route path="registrationDetail" element={<RegistrationDetail />} />
            <Route path="registrationPayment" element={<RegistrationPayment />} />
            <Route path="registrationPaymentConfirmation" element={<RegistrationPaymentConfirmation />} />
            <Route path="registrationPaymentResult" element={<RegistrationPaymentResult />} />
            <Route path="registrationLink" element={<RegistrationLink />} />
            <Route path="backoffice" element={<BackOfficeLayout />}>
              <Route path="eventList" element={<EventList />} />
              <Route path="participantList/:id" element={<ParticipantList />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="setting" element={<Setting />} />
              <Route path="contractList" element={<ContractList />} />
              <Route path="announcementList" element={<AnnouncementList />} />
              <Route path="eventCalendarList" element={<EventCalendarList />} />
              <Route path="eventCalendarDetails/:id" element={<EventCalendarDetails />} />
              <Route path="couponList" element={<CouponList />} />
              <Route path="couponDetails/:id" element={<CouponDetails />} />
              <Route path="reportList" element={<ReportList />} />
              <Route path="historyList" element={<PaymentHistory />} />
              <Route path="operations" element={<Operations />} />
            </Route>
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/invite/accept" element={<InviteAccept />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/changepassword/:id" element={<ChangePassword />} />
          <Route path="/*" element={<Error />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
