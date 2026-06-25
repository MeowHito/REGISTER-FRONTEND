import { useEffect, useMemo, useState } from "react";
import { Button, Result, Spin, message, Input } from "antd";
import {
  ArrowRightOutlined, CheckCircleOutlined, ShoppingCartOutlined,
  EnvironmentOutlined, CarOutlined, DownOutlined, UpOutlined, LockOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import CommonForm from "components/commonForm";
import FrontLayout from "components/frontLayout";
import useMe from "hooks/useMe";
import useCountryStateHook from "hooks/useCountryStateHook";
import masterService from "services/master.services";
import backOfficeServices from "services/backoffice.services";
import generalService from "services/general.services";
import { SET_ORDER, CLEAR_ORDER, SET_PROPS } from "store/reducers/contextSlice";
import { handleQueryStatus } from "utils";

import ApplicantForm from "./ApplicantForm";
import ShirtPicker from "./ShirtPicker";
import { finalizeApplicants, totalQty, resolvePricing } from "./utils";
import { primaryBtn, phaseBadgeCls } from "./theme";
import useBilingual from "./useBilingual";

const SECTIONS = ["tickets", "info", "shirt", "shipping"];
const fmt = (n) => (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

// Used when the master nationalities API is unavailable so the form stays usable.
const FALLBACK_NATIONALITIES = [
  { value: "THA", label: "Thai" },
  { value: "LAO", label: "Lao" },
  { value: "MMR", label: "Burmese" },
  { value: "KHM", label: "Cambodian" },
  { value: "VNM", label: "Vietnamese" },
  { value: "CHN", label: "Chinese" },
  { value: "JPN", label: "Japanese" },
  { value: "KOR", label: "Korean" },
  { value: "USA", label: "American" },
  { value: "GBR", label: "British" },
  { value: "OTH", label: "Other" },
];

/* ---------- accordion shell ---------- */
const Section = ({ id, step, title, open, reached, onToggle, children }) => {
  const locked = !reached;
  return (
    <div className="bg-white border border-[#bfc7d2] rounded-xl overflow-hidden mb-4 shadow-sm">
      <button type="button" disabled={locked} onClick={() => onToggle(id)}
        className="w-full flex justify-between items-center px-4 py-4 bg-[#f1f4f6] disabled:cursor-not-allowed">
        <div className="flex items-center gap-3">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            reached ? "bg-[#006193] text-white" : "bg-[#e0e3e5] text-[#3f4850]"}`}>{step}</span>
          <span className={`font-bold ${reached ? "text-[#181c1e]" : "text-[#3f4850] opacity-60"}`}>{title}</span>
        </div>
        <span className="text-[#3f4850]">
          {locked ? <LockOutlined /> : open ? <UpOutlined /> : <DownOutlined />}
        </span>
      </button>
      {open && !locked ? <div className="p-4 border-t border-[#e5e9eb]">{children}</div> : null}
    </div>
  );
};

const StreamlinedRegistration = () => {
  const { t } = useTranslation();
  const bi = useBilingual();
  const params = useParams();
  const eventKey = params.id || params.name;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const order = useSelector((state) => state.context.order) || {};
  const [form] = CommonForm.useForm();

  const [tickets, setTickets] = useState({});
  const [availability, setAvailability] = useState([]);
  const [openSection, setOpenSection] = useState("tickets");
  const [maxReached, setMaxReached] = useState(0);
  const [nationalityOption, setNationalityOption] = useState([]);
  const [eventConditions, setEventConditions] = useState([]);
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  const [shippingAddress, setShippingAddress] = useState("");
  // Drives how many applicant cards to render. Kept in React state (not Form.useWatch)
  // so the cards render reliably; the form itself only holds the editable field values.
  const [applicantList, setApplicantList] = useState([]);

  /* ---------- data ---------- */
  const { data: me, status: meStatus, isPending: isLoadingMe } = useMe({ retry: 0 });
  const roleUser = me?.role?.roleType;
  const meReady = meStatus === "success";

  const { isLoadingProvince, provinceOption } = useCountryStateHook({ valueKey: "stateLocal" });
  const { data: nationalities, isFetching: isLoadingNationality, ...otherNat } =
    masterService.useQueryGetNationality();
  const { data: event, isFetching: isLoadingEvent, ...otherEvent } =
    backOfficeServices.useQueryGetEventById({ id: eventKey, enabled: meReady });
  const availabilityMutation = generalService.useMutationGetEventTypesAvailability();

  useEffect(() => {
    if (order?.orderNo) {
      navigate("/registrationPayment", { replace: true });
      return;
    }
    dispatch(CLEAR_ORDER());
  }, []);

  useEffect(() => {
    handleQueryStatus(otherEvent, async () => {
      setEventConditions(event?.eventConditions || []);
      dispatch(SET_PROPS({ id: "eventData", payload: event }));
      try {
        const res = await availabilityMutation.mutateAsync(event.id);
        if (res?.success && Array.isArray(res.data)) setAvailability(res.data);
      } catch {
        /* fall back to static eventType.price */
      }
    });
  }, [otherEvent.fetchStatus]);

  useEffect(() => {
    handleQueryStatus(
      otherNat,
      () => {
        const opts = (nationalities || []).map((n) => ({ value: n.alpha_3_code, label: n.nationality }));
        setNationalityOption(opts.length ? opts : FALLBACK_NATIONALITIES);
      },
      () => setNationalityOption(FALLBACK_NATIONALITIES) // master API unavailable → keep form usable
    );
  }, [otherNat.fetchStatus]);

  /* ---------- derived ---------- */
  const eventTypeRows = useMemo(
    () => (event?.eventTypes || []).map((et) => {
      const p = resolvePricing(et, availability);
      return {
        ...et,
        _price: p.price,
        _available: p.isAvailable,
        _closed: p.isClosed,
        _paymentName: p.paymentName,
        _special: p.isSpecialPrice,
      };
    }),
    [event, availability]
  );

  const shippingFee = event?.shippingFee;
  const subtotal = applicantList.reduce((s, a) => s + (Number(a?.price) || 0), 0);
  const liveTicketTotal = eventTypeRows.reduce((s, et) => s + (tickets[et.id] || 0) * et._price, 0);
  const totalShipping = deliveryMethod === "post" && shippingFee != null ? shippingFee : 0;
  const grandTotal = (applicantList.length ? subtotal : liveTicketTotal) + totalShipping;

  const reachedIdx = (id) => SECTIONS.indexOf(id);
  const isReached = (id) => reachedIdx(id) <= maxReached;
  const goTo = (id) => setOpenSection((p) => (p === id ? null : id));
  const advanceTo = (id) => {
    setMaxReached((m) => Math.max(m, reachedIdx(id)));
    setOpenSection(id);
    setTimeout(() => globalThis.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  /* ---------- actions ---------- */
  const setQty = (etId, delta) =>
    setTickets((prev) => ({ ...prev, [etId]: Math.max(0, (prev[etId] || 0) + delta) }));

  const confirmTickets = () => {
    if (totalQty(tickets) < 1) {
      message.warning(bi("required.eventType"));
      return;
    }
    const prev = form.getFieldValue("applicants") || [];
    const prevByType = {};
    prev.forEach((p) => { (prevByType[p.eventTypeId] ||= []).push(p); });
    const used = {};
    const list = [];
    eventTypeRows.forEach((et) => {
      const qty = tickets[et.id] || 0;
      const p = resolvePricing(et, availability);
      for (let i = 0; i < qty; i += 1) {
        const arr = prevByType[et.id] || [];
        const k = used[et.id] || 0;
        used[et.id] = k + 1;
        list.push({
          ...(arr[k] || {}),
          eventTypeId: et.id, eventTypeName: et.name, eventDate: event.eventDate, eventName: event.name,
          price: p.price, pricingId: p.pricingId, paymentName: p.paymentName, noShirt: false,
        });
      }
    });
    form.setFieldValue("applicants", list);
    setApplicantList(list);
    advanceTo("info");
  };

  const namePathsFor = (keys) => applicantList.flatMap((_a, i) => keys.map((k) => ["applicants", i, k]));

  // Remove a single applicant card (e.g. registered for self + a friend, then
  // dropped the friend). Re-index the whole `applicants` array via setFieldsValue
  // so every field — including the imperative pictureUrl — shifts correctly, and
  // give the matching ticket count back.
  const removeApplicant = (i) => {
    const cur = form.getFieldValue("applicants") || [];
    const removed = cur[i];
    const next = cur.filter((_a, idx) => idx !== i);
    form.setFieldsValue({ applicants: next });
    setApplicantList(next);
    if (removed?.eventTypeId) {
      setTickets((prev) => ({
        ...prev,
        [removed.eventTypeId]: Math.max(0, (prev[removed.eventTypeId] || 0) - 1),
      }));
    }
  };

  // After a failed validateFields: scroll to the first offending field and show
  // its (bilingual) reason so the user knows exactly what to fix and where.
  const handleValidateError = (errInfo) => {
    const fields = errInfo?.errorFields || [];
    if (!fields.length) {
      message.error(bi("validation.checkForm"));
      return;
    }
    const first = fields[0];
    form.scrollToField(first.name, { behavior: "smooth", block: "center" });
    message.error(first.errors?.[0] || bi("validation.checkForm"));
  };

  const confirmInfo = async () => {
    const current = form.getFieldValue("applicants") || [];
    if (applicantList.some((_a, i) => !current[i]?.type)) {
      message.warning(bi("back.reg.common.selectApplicant"));
      return;
    }
    try {
      await form.validateFields();
      advanceTo("shirt");
    } catch (errInfo) {
      handleValidateError(errInfo);
    }
  };

  const confirmShirt = async () => {
    try {
      await form.validateFields(namePathsFor(["shirtTypeId", "shirtSizeId"]));
      advanceTo("shipping");
    } catch (errInfo) {
      handleValidateError(errInfo);
    }
  };

  const checkout = () => {
    if (deliveryMethod === "post" && !shippingAddress.trim()) {
      message.warning(bi("back.reg.payment.enterAddress"));
      return;
    }
    const raw = form.getFieldValue("applicants") || [];
    const withDelivery = raw.map((a, i) => ({
      ...a,
      deliveryMethod,
      // flat shipping fee charged once for the single shipment
      shippingFee: deliveryMethod === "post" && i === 0 ? shippingFee : 0,
      shippingAddress: deliveryMethod === "post" ? shippingAddress.trim() : undefined,
    }));
    const finalApplicants = finalizeApplicants(withDelivery, event, t);

    dispatch(SET_PROPS({ id: "eventData", payload: event }));
    dispatch(SET_ORDER({
      applicants: finalApplicants,
      eventConditions,
      eventId: event.id,
      eventData: event,
    }));
    navigate("/registrationDetail");
  };

  const primaryAction = () => {
    if (openSection === "tickets") return confirmTickets();
    if (openSection === "info") return confirmInfo();
    if (openSection === "shirt") return confirmShirt();
    return checkout();
  };

  /* ---------- guards ---------- */
  if (isLoadingMe || (meReady && isLoadingEvent)) {
    return <FrontLayout><div className="flex justify-center items-center h-[70vh]"><Spin /></div></FrontLayout>;
  }
  if (!roleUser || meStatus === "error") {
    return (
      <FrontLayout><div className="flex justify-center items-center h-[70vh]">
        <Result status="warning" title={t("general.pleaseLogin")} subTitle={t("general.pleaseLoginDetail")}
          extra={[<Link to="/login" key="login"><Button type="primary">{t("general.login")}</Button></Link>]} />
      </div></FrontLayout>
    );
  }
  if (roleUser !== "guest") {
    return (
      <FrontLayout><div className="flex justify-center items-center h-[70vh]">
        <Result status="403" title={t("general.noPermission")} subTitle={t("general.noPermissionDetail")}
          extra={[<Link to="/contact" key="contact"><Button>{t("general.contactSupport")}</Button></Link>]} />
      </div></FrontLayout>
    );
  }

  const stepLabels = ["Tickets", "ข้อมูล", "เสื้อ", "จัดส่ง"];

  return (
    <FrontLayout fullWidth>
      <div className="bg-[#f7fafc] min-h-screen">
        <div className="max-w-screen-md mx-auto px-4 py-6 pb-28">
          {/* event header */}
          <div className="mb-6 border-l-4 border-[#fe9400] pl-4">
            <h2 className="text-2xl font-bold text-[#181c1e] mb-1">{event?.name}</h2>
            <p className="text-sm font-bold text-[#3f4850] flex items-center gap-2">
              📅 {event?.eventDate ? dayjs(event.eventDate).format("D MMM YYYY") : ""}
              {event?.location ? ` • ${event.location}` : ""}
            </p>
          </div>

          {/* stepper */}
          <div className="flex items-center justify-between mb-10 px-1">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i <= maxReached ? "bg-[#006193] text-white" : "bg-[#e0e3e5] text-[#3f4850]"}`}>{i + 1}</div>
                  <span className={`text-xs font-bold ${i <= maxReached ? "text-[#006193]" : "text-[#3f4850] opacity-60"}`}>{label}</span>
                </div>
                {i < 3 && <div className={`flex-1 h-[2px] mx-2 -mt-5 ${i < maxReached ? "bg-[#006193]" : "bg-[#bfc7d2]"}`} />}
              </div>
            ))}
          </div>

          <CommonForm form={form}>
            {/* SECTION 1 — tickets */}
            <Section id="tickets" step={1} open={openSection === "tickets"} reached
              title="1. เลือกประเภทตั๋ว (Select Ticket)" onToggle={goTo}>
              <div className="space-y-4">
                {eventTypeRows.map((et) => {
                  const qty = tickets[et.id] || 0;
                  return (
                    <div key={et.id}
                      className={`border p-4 rounded-lg flex justify-between items-center gap-3 transition-all ${
                        et._closed ? "border-[#bfc7d2] bg-[#f1f4f6] opacity-80"
                          : qty > 0 ? "border-[#006193] border-2" : "border-[#bfc7d2]"}`}>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#181c1e] mb-1">{et.name}</h3>
                        {et._closed ? (
                          <p className="text-sm font-bold text-[#ba1a1a]">ปิดรับสมัครแล้ว / Closed</p>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-wrap">
                              {et._special && et._paymentName ? (
                                <span className={phaseBadgeCls}>{et._paymentName}</span>
                              ) : null}
                              <span className="text-[#006193] font-bold text-lg">{Number(et._price).toLocaleString()} THB</span>
                            </div>
                            {!et._available && <p className="text-xs text-[#ba1a1a] mt-1">{t("front.eventDetail.quotaFull")}</p>}
                          </>
                        )}
                      </div>
                      {et._closed ? null : (
                        <div className="flex items-center gap-3 bg-[#ebeef0] rounded-full p-1 border border-[#bfc7d2] shrink-0">
                          <button type="button" onClick={() => setQty(et.id, -1)} disabled={qty === 0}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-[#006193] hover:bg-[#e0e3e5] disabled:text-[#bfc7d2] text-xl font-bold">−</button>
                          <span className="w-5 text-center font-bold">{qty}</span>
                          <button type="button" onClick={() => setQty(et.id, 1)} disabled={!et._available}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-[#006193] text-white shadow hover:opacity-90 disabled:bg-[#bfc7d2] text-xl font-bold">+</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button type="button" className={primaryBtn} onClick={confirmTickets}>
                  Next <ArrowRightOutlined />
                </button>
              </div>
            </Section>

            {/* SECTION 2 — athlete info */}
            <Section id="info" step={2} open={openSection === "info"} reached={isReached("info")}
              title="2. ข้อมูลผู้สมัคร (Athlete Information)" onToggle={goTo}>
              <div className="space-y-5">
                {applicantList.map((a, i) => (
                  <ApplicantForm key={i} index={i} ticketLabel={a?.eventTypeName} me={me} event={event}
                    form={form} provinceOption={provinceOption} isLoadingProvince={isLoadingProvince}
                    nationalityOption={nationalityOption} isLoadingNationality={isLoadingNationality}
                    canRemove={applicantList.length > 1} onRemove={removeApplicant} />
                ))}
                <button type="button" className={primaryBtn} onClick={confirmInfo}>
                  Next <ArrowRightOutlined />
                </button>
              </div>
            </Section>

            {/* SECTION 3 — shirt */}
            <Section id="shirt" step={3} open={openSection === "shirt"} reached={isReached("shirt")}
              title="3. เลือกแบบเสื้อ (Shirt)" onToggle={goTo}>
              <div className="space-y-5">
                {applicantList.map((a, i) => (
                  <ShirtPicker key={i} index={i} ticketLabel={a?.eventTypeName} event={event} form={form} />
                ))}
                <button type="button" className={primaryBtn} onClick={confirmShirt}>
                  Complete Selection <CheckCircleOutlined />
                </button>
              </div>
            </Section>

            {/* SECTION 4 — shipping */}
            <Section id="shipping" step={4} open={openSection === "shipping"} reached={isReached("shipping")}
              title="4. เลือกประเภทการจัดส่ง (Shipping)" onToggle={goTo}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#3f4850] mb-3">ประเภทการจัดส่ง (Shipping Method)</label>
                  <div className="grid grid-cols-1 gap-3">
                    <button type="button" onClick={() => setDeliveryMethod("pickup")}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all ${
                        deliveryMethod === "pickup" ? "border-[#006193] bg-[#cce5ff]" : "border-[#bfc7d2] bg-white hover:border-[#006193]"}`}>
                      <EnvironmentOutlined className="text-2xl text-[#006193]" />
                      <div className="flex-1">
                        <div className="font-bold text-[#006193]">รับด้วยตัวเอง (Self-Pickup)</div>
                        <div className="text-xs text-[#006193]/70">รับที่หน้างาน - ฟรี</div>
                      </div>
                      {deliveryMethod === "pickup" && <CheckCircleOutlined className="text-[#006193]" />}
                    </button>

                    {shippingFee != null && (
                      <button type="button" onClick={() => setDeliveryMethod("post")}
                        className={`flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all ${
                          deliveryMethod === "post" ? "border-[#006193] bg-[#cce5ff]" : "border-[#bfc7d2] bg-white hover:border-[#006193]"}`}>
                        <CarOutlined className="text-2xl text-[#006193]" />
                        <div className="flex-1">
                          <div className="font-bold text-[#181c1e]">จัดส่งทางไปรษณีย์ (Postal Delivery)</div>
                          <div className="text-xs text-[#3f4850]">
                            {shippingFee === 0 ? t("back.reg.payment.free") : `ค่าจัดส่ง ${Number(shippingFee).toLocaleString()} THB`}
                          </div>
                        </div>
                        {deliveryMethod === "post" && <CheckCircleOutlined className="text-[#006193]" />}
                      </button>
                    )}
                  </div>
                </div>

                {deliveryMethod === "post" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#3f4850]">
                      ที่อยู่สำหรับจัดส่ง / Shipping Address <span className="text-[#ba1a1a]">*</span>
                    </label>
                    <Input.TextArea rows={4} value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="!rounded-lg !border-[#bfc7d2] !text-base"
                      placeholder="กรอกที่อยู่สำหรับจัดส่งเอกสารและเสื้อ" />
                  </div>
                )}

                <button type="button" className={primaryBtn} onClick={checkout}>
                  Checkout <ShoppingCartOutlined />
                </button>
              </div>
            </Section>
          </CommonForm>
        </div>
      </div>

      {/* sticky total bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[#bfc7d2] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
        <div className="max-w-screen-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-[#3f4850]">Total Payment</span>
            <span className="text-2xl font-bold text-[#006193]">{fmt(grandTotal)} THB</span>
          </div>
          <button type="button" onClick={primaryAction}
            className="bg-[#fe9400] text-[#633700] font-bold px-7 h-12 rounded-full flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
            {openSection === "shipping" ? "Checkout" : "ถัดไป"}
            {openSection === "shipping" ? <ShoppingCartOutlined /> : <ArrowRightOutlined />}
          </button>
        </div>
      </div>
    </FrontLayout>
  );
};

export default StreamlinedRegistration;
