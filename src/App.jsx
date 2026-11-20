import MainLayout from 'layouts/mainLayout';
import './App.css';
import "./i18n";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from 'pages/front/home';
import ScrollToTop from 'components/scrollToTop';
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { lazy, Suspense, useEffect } from 'react';
import { ConfigProvider, Spin } from 'antd';
import thTH from 'antd/locale/th_TH';
import enUS from 'antd/locale/en_US';

// Route pages are split into their own chunks and load when first visited.
const Error = lazy(() => import('pages/front/error'));
const Login = lazy(() => import('pages/backOffice/login'));
const Register = lazy(() => import('pages/backOffice/register'));
const Setting = lazy(() => import('pages/backOffice/setting'));
const Forgot = lazy(() => import('pages/backOffice/forgot'));
const ChangePassword = lazy(() => import('pages/backOffice/changepassword'));
const BackOfficeLayout = lazy(() => import('components/backOfficeLayout'));
const EventList = lazy(() => import('pages/backOffice/event/eventList'));
const RegistrationDetail = lazy(() => import('pages/front/registration').then((m) => ({ default: m.RegistrationDetail })));
const RegistrationPayment = lazy(() => import('pages/front/registration').then((m) => ({ default: m.RegistrationPayment })));
const RegistrationPaymentConfirmation = lazy(() => import('pages/front/registration').then((m) => ({ default: m.RegistrationPaymentConfirmation })));
const RegistrationPaymentResult = lazy(() => import('pages/front/registration').then((m) => ({ default: m.RegistrationPaymentResult })));
const RegistrationLink = lazy(() => import('pages/front/registration').then((m) => ({ default: m.RegistrationLink })));
const StreamlinedRegistration = lazy(() => import('pages/front/registration').then((m) => ({ default: m.StreamlinedRegistration })));
const Dashboard = lazy(() => import('pages/backOffice/dashboard'));
const EventStats = lazy(() => import('pages/backOffice/eventStats'));
const ContractList = lazy(() => import('pages/backOffice/contract/contractList'));
const AnnouncementList = lazy(() => import('pages/backOffice/announcement/announcementList'));
const EventDetail = lazy(() => import('pages/front/eventDetail'));
const EventCalendar = lazy(() => import('pages/front/eventCalendar'));
const ParticipantSearch = lazy(() => import('pages/front/participantSearch'));
const PaymentHistory = lazy(() => import('pages/backOffice/paymentHistory'));
const CouponList = lazy(() => import('pages/backOffice/coupon/couponList'));
const CouponDetails = lazy(() => import('pages/backOffice/coupon/couponDetails'));
const TermsOfUse = lazy(() => import('pages/backOffice/termsOfUse'));
const Contact = lazy(() => import('pages/front/contact'));
const EventCalendarList = lazy(() => import('pages/backOffice/eventCalendar/eventCalendarList'));
const EventCalendarDetails = lazy(() => import('pages/backOffice/eventCalendar/eventCalendarDetails'));
const ParticipantList = lazy(() => import('pages/backOffice/event/participantList'));
const ReportList = lazy(() => import('pages/backOffice/report'));
const InviteAccept = lazy(() => import('pages/front/inviteAccept'));
const Operations = lazy(() => import('pages/backOffice/operations'));
const Event = lazy(() => import('pages/front/event'));

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    dayjs.locale(i18n.language);
  }, [i18n.language]);

  return (
    // virtual={false}: dropdown lists scroll natively (momentum on phones) instead of antd's
    // virtual list, which felt stiff to flick through; our longest list is ~200 nationalities.
    <ConfigProvider locale={i18n.language === 'th' ? thTH : enUS} virtual={false}>
      <BrowserRouter>
        <ScrollToTop />
        {/* Pages load on demand: a runner opening the home page no longer downloads the whole
            back office (charts, editors, Excel export) before seeing anything. */}
        <Suspense fallback={<div className="min-h-dvh flex items-center justify-center"><Spin /></div>}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="contact" element={<Contact />} />
            <Route path="event" element={<Event />} />
            <Route path="eventCalendar" element={<EventCalendar />} />
            <Route path="eventDetail/:name" element={<EventDetail />} />
            <Route path="participantSearch/:eventId" element={<ParticipantSearch />} />
            <Route path="registrationInfo/:id" element={<StreamlinedRegistration />} />
            <Route path="registrationDetail" element={<RegistrationDetail />} />
            <Route path="registrationPayment" element={<RegistrationPayment />} />
            <Route path="registrationPaymentConfirmation" element={<RegistrationPaymentConfirmation />} />
            <Route path="registrationPaymentResult" element={<RegistrationPaymentResult />} />
            <Route path="registrationLink" element={<RegistrationLink />} />
            {/* Back office at the root; utils BACK_OFFICE_PATHS must list every path here. */}
            <Route element={<BackOfficeLayout />}>
              <Route path="eventList" element={<EventList />} />
              <Route path="participantList/:id" element={<ParticipantList />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="eventStats" element={<EventStats />} />
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
          <Route path="/organizer/login" element={<Login organizerMode />} />
          <Route path="/organizer/register" element={<Register organizerMode />} />
          <Route path="/invite/accept" element={<InviteAccept />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<Forgot />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/changepassword/:id" element={<ChangePassword />} />
          <Route path="/*" element={<Error />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
