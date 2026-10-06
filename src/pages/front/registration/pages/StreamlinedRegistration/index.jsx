import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Result, Spin, message, Input } from "antd";
import {
  ArrowRightOutlined, CheckCircleOutlined, ShoppingCartOutlined,
  EnvironmentOutlined, CarOutlined, DownOutlined, UpOutlined, LockOutlined, HomeOutlined, EditOutlined,
} from "@ant-design/icons";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

import CommonForm from "components/commonForm";
import FrontLayout from "components/frontLayout";
import ProvinceSelector from "components/provinceSelector";
import useMe from "hooks/useMe";
import useCountryStateHook from "hooks/useCountryStateHook";
import masterService from "services/master.services";
import backOfficeServices from "services/backoffice.services";
import generalService from "services/general.services";
import { SET_ORDER, CLEAR_ORDER, SET_PROPS } from "store/reducers/contextSlice";
import { handleQueryStatus, scrollPageToTop } from "utils";

import ApplicantForm from "./ApplicantForm";
import ShirtPicker from "./ShirtPicker";
import { shirtFieldPaths } from "./shirts";
import AddOnPicker from "./AddOnPicker";
import QuestionnaireStep from "./QuestionnaireStep";
import { hasQuestions, questionsFor } from "./questionnaire";
import {
  finalizeApplicants, totalQty, resolvePricing, ticketPrice,
  sellableAddOns, buildAddOnOrder, addOnsTotal, firstMissingAddOnNote,
} from "./utils";
import { primaryBtn, phaseBadgeCls, inputCls, fieldItemCls } from "./theme";
import { resolveFieldConfig } from "./fieldConfig";
import { onUploadFile } from "hooks/onUploadFile";
import { getPublicUrl } from "utils/fileUtils";
import { DEFAULT_PHONE_COUNTRY_CODE } from "constants/phoneCountryCodes";

const QUESTIONNAIRE_PREFIX = "questionnaire";
const fmt = (n) => (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
// Height of the sticky site header, so a scrolled-to section isn't hidden under it.
const HEADER_OFFSET = 64;

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

const SHIPPING_KEYS = ["shippingAddress", "shippingDistrict", "shippingAmphoe", "shippingProvince", "shippingZipcode"];

/** The address a runner already saved on their profile: shipping address first, home address otherwise. */
const savedAddressOf = (me) => {
  if (!me) return null;
  const pick = (a, d, am, p, z) =>
    (a || d || am || p || z) ? { shippingAddress: a || "", shippingDistrict: d || "", shippingAmphoe: am || "", shippingProvince: p || "", shippingZipcode: z || "" } : null;
  return (
    pick(me.shippingAddress, me.shippingDistrict, me.shippingAmphoe, me.shippingProvince, me.shippingZipcode) ||
    pick(me.address, me.district, me.amphoe, me.province, me.zipcode)
  );
};

const formatAddress = (a, t) =>
  [a.shippingAddress, a.shippingDistrict && `${t("back.reg.common.subdistrictPrefix")}${a.shippingDistrict}`,
    a.shippingAmphoe && `${t("back.reg.common.districtPrefix")}${a.shippingAmphoe}`,
    a.shippingProvince && `${t("back.reg.common.provincePrefix")}${a.shippingProvince}`, a.shippingZipcode]
    .filter(Boolean).join(" ");

/* ---------- accordion shell ---------- */
// Flat, edge-to-edge sections (no card frame) so the form uses the whole phone width.
const Section = ({ id, step, title, open, reached, onToggle, children }) => {
  const locked = !reached;
  return (
    <div id={`section-${id}`} className="bg-white border-b border-[#e5e9eb] md:border md:border-[#bfc7d2] md:rounded-xl md:overflow-hidden md:mb-4 md:shadow-sm">
      <button type="button" disabled={locked} onClick={() => onToggle(id)}
        className="w-full flex justify-between items-center px-4 py-4 bg-[#f1f4f6] disabled:cursor-not-allowed">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-bold ${
            reached ? "bg-[#006193] text-white" : "bg-[#e0e3e5] text-[#3f4850]"}`}>{step}</span>
          <span className={`font-bold truncate ${reached ? "text-[#181c1e]" : "text-[#3f4850] opacity-60"}`}>{title}</span>
        </div>
        <span className="text-[#3f4850] shrink-0">
          {locked ? <LockOutlined /> : open ? <UpOutlined /> : <DownOutlined />}
        </span>
      </button>
      {open && !locked ? <div className="p-4 border-t border-[#e5e9eb]">{children}</div> : null}
    </div>
  );
};

const StreamlinedRegistration = () => {
  const { t, i18n } = useTranslation();
  const params = useParams();
  const eventKey = params.id || params.name;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const order = useSelector((state) => state.context.order) || {};
  const [form] = CommonForm.useForm();

  const [tickets, setTickets] = useState({});
  const [availability, setAvailability] = useState([]);
  const [openSection, setOpenSection] = useState("tickets");
  const [maxReached, setMaxReached] = useState(0);
  const [nationalityOption, setNationalityOption] = useState([]);
  const [eventConditions, setEventConditions] = useState([]);
  const [deliveryMethod, setDeliveryMethod] = useState("pickup");
  // "saved" = the address on the runner's profile, "new" = the address form below.
  const [addressMode, setAddressMode] = useState("saved");
  // Add-on picks keyed by add-on id: { qty } for per-order, { applicants: {idx: true} }
  // for per-applicant, plus an optional { note }.
  const [addOnSelections, setAddOnSelections] = useState({});
  // Drives how many applicant cards to render. Kept in React state (not Form.useWatch)
  // so the cards render reliably; the form itself only holds the editable field values.
  const [applicantList, setApplicantList] = useState([]);
  // Coming back from the review page: restore everything the runner typed.
  const resumeDraft = useRef(location.state?.resume && !order?.orderNo ? order?.draft : null);

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
    // Land at the top: the event page's register button sits at the bottom of a long page.
    scrollPageToTop();
    if (order?.orderNo) {
      navigate("/registrationPayment", { replace: true });
      return;
    }
    if (!resumeDraft.current) dispatch(CLEAR_ORDER());
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
      const teamSize = et.isTeam ? Math.max(Number(et.teamSize) || 2, 2) : 1;
      // a team needs a slot for every member
      const teamFits = !et.isTeam || p.availableQuota == null || p.availableQuota >= teamSize;
      return {
        ...et,
        _price: p.price,
        _ticketPrice: ticketPrice(et, p.price),
        _teamSize: teamSize,
        _available: p.isAvailable && teamFits,
        _closed: p.isClosed,
        _paymentName: p.paymentName,
        _special: p.isSpecialPrice,
      };
    }),
    [event, availability]
  );
  const fieldConfig = useMemo(() => resolveFieldConfig(event), [event]);

  // Add-ons and extra questions are steps only when this event uses them, so the
  // flow stays four steps for every event that doesn't.
  const addOns = useMemo(() => sellableAddOns(event), [event]);
  const hasAddOns = addOns.length > 0;
  const hasQuestionStep = useMemo(() => hasQuestions(event, applicantList), [event, applicantList]);
  const SECTIONS = useMemo(
    () => ["tickets", "info", "shirt", ...(hasQuestionStep ? ["questions"] : []), "shipping", ...(hasAddOns ? ["addons"] : [])],
    [hasAddOns, hasQuestionStep]
  );

  const savedAddress = useMemo(() => savedAddressOf(me), [me]);
  const hasSavedAddress = !!savedAddress;
  // Default to the profile address once the profile has loaded; the new-address form otherwise.
  useEffect(() => {
    setAddressMode(hasSavedAddress ? "saved" : "new");
  }, [hasSavedAddress]);

  // Restore the draft once the event is loaded (the ticket rows need it).
  useEffect(() => {
    const draft = resumeDraft.current;
    if (!draft || !event) return;
    resumeDraft.current = null;
    const applicants = (draft.applicants || []).map((a) => ({
      ...a,
      birthDate: a?.birthDate ? dayjs(a.birthDate) : undefined,
    }));
    form.setFieldsValue({ applicants, shipping: draft.shipping || {} });
    setApplicantList(applicants);
    setTickets(draft.tickets || {});
    setDeliveryMethod(draft.deliveryMethod || "pickup");
    if (draft.addressMode) setAddressMode(draft.addressMode);
    setAddOnSelections(draft.addOnSelections || {});
    // Every step was completed once, so unlock them all (the question/add-on steps
    // only appear after the applicants are set, so don't count sections here).
    setMaxReached(99);
    setOpenSection("tickets");
  }, [event]); // eslint-disable-line react-hooks/exhaustive-deps

  const shippingFee = event?.shippingFee;
  const subtotal = applicantList.reduce((s, a) => s + (Number(a?.price) || 0), 0);
  const liveTicketTotal = eventTypeRows.reduce((s, et) => s + (tickets[et.id] || 0) * et._ticketPrice, 0);
  const totalShipping = deliveryMethod === "post" && shippingFee != null ? shippingFee : 0;
  const totalAddOns = addOnsTotal(addOns, addOnSelections);
  const grandTotal = (applicantList.length ? subtotal : liveTicketTotal) + totalShipping + totalAddOns;

  const lastSection = SECTIONS[SECTIONS.length - 1];
  const reachedIdx = (id) => SECTIONS.indexOf(id);
  const isReached = (id) => reachedIdx(id) <= maxReached;
  const goTo = (id) => setOpenSection((p) => (p === id ? null : id));

  // The page scrolls inside <body> (overflow-y: auto in index.css), not the window, so
  // window.scrollTo is a no-op here; scrollIntoView works whichever ancestor scrolls.
  const scrollToEl = (el) => {
    if (!el) return;
    el.style.scrollMarginTop = `${HEADER_OFFSET}px`;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // Open the next section and put its header at the top of the screen, so "Next"
  // lands the runner on step N+1 instead of somewhere up the page.
  const advanceTo = (id) => {
    setMaxReached((m) => Math.max(m, reachedIdx(id)));
    setOpenSection(id);
    setTimeout(() => scrollToEl(document.getElementById(`section-${id}`)), 60);
  };

  /* ---------- actions ---------- */
  const setQty = (etId, delta) =>
    setTickets((prev) => ({ ...prev, [etId]: Math.max(0, (prev[etId] || 0) + delta) }));

  const confirmTickets = () => {
    if (totalQty(tickets) < 1) {
      message.warning(t("required.eventType"));
      return;
    }
    const prev = form.getFieldValue("applicants") || [];
    const prevByType = {};
    prev.forEach((p) => { (prevByType[p.eventTypeId] ||= []).push(p); });
    const used = {};
    const list = [];
    let teamGroup = 0;
    eventTypeRows.forEach((et) => {
      const qty = tickets[et.id] || 0;
      const p = resolvePricing(et, availability);
      const members = et.isTeam ? et._teamSize : 1;
      for (let i = 0; i < qty; i += 1) {
        // a team ticket expands to one applicant per member; a whole-team price sits on member 1
        const group = et.isTeam ? ++teamGroup : null;
        for (let m = 0; m < members; m += 1) {
          const arr = prevByType[et.id] || [];
          const k = used[et.id] || 0;
          used[et.id] = k + 1;
          const memberPrice = et.isTeam && et.teamPricing === "PER_TEAM" && m > 0 ? 0 : p.price;
          list.push({
            phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
            emergencyPhoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
            idType: "idCard",
            ...(arr[k] || {}),
            eventTypeId: et.id, eventTypeName: et.name, eventDate: event.eventDate, eventName: event.name,
            price: memberPrice, pricingId: p.pricingId, paymentName: p.paymentName, noShirt: false,
            teamGroup: group, teamSize: et.isTeam ? members : null, teamIndex: et.isTeam ? m + 1 : null,
          });
        }
      }
    });
    form.setFieldValue("applicants", list);
    setApplicantList(list);
    advanceTo("info");
  };

  // Applicant cards in order, with team members bundled under their team header.
  const applicantGroups = useMemo(() => {
    const groups = [];
    applicantList.forEach((a, i) => {
      const last = groups[groups.length - 1];
      if (a?.teamGroup && last?.teamGroup === a.teamGroup) {
        last.items.push({ a, i });
      } else {
        groups.push({ teamGroup: a?.teamGroup || null, eventTypeName: a?.eventTypeName, items: [{ a, i }] });
      }
    });
    return groups;
  }, [applicantList]);

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
    // Per-applicant add-ons are keyed by position, so re-index them the same way
    // the applicants array was, or the wrong runner keeps the package.
    setAddOnSelections((prev) => {
      const next = {};
      Object.entries(prev).forEach(([addOnId, sel]) => {
        if (!sel?.applicants) {
          next[addOnId] = sel;
          return;
        }
        const shifted = {};
        Object.entries(sel.applicants).forEach(([idx, on]) => {
          const n = Number(idx);
          if (!on || n === i) return;
          shifted[n > i ? n - 1 : n] = true;
        });
        next[addOnId] = { ...sel, applicants: shifted };
      });
      return next;
    });
  };

  // After a failed validateFields: jump to the first field that is marked as
  // erroneous and show its reason. The DOM lookup (rather than form.scrollToField)
  // also works for custom controls such as the box selectors and the photo box.
  const handleValidateError = (errInfo) => {
    const fields = errInfo?.errorFields || [];
    message.error(fields[0]?.errors?.[0] || t("validation.checkForm"));
    setTimeout(() => {
      const el = document.querySelector(".ant-form-item-has-error");
      if (el) scrollToEl(el);
      else if (fields[0]) form.scrollToField(fields[0].name, { behavior: "smooth", block: "center" });
    }, 50);
  };

  const confirmInfo = async () => {
    const current = form.getFieldValue("applicants") || [];
    const missingType = applicantList.findIndex((_a, i) => !current[i]?.type);
    if (missingType >= 0) {
      message.warning(t("back.reg.common.selectApplicant"));
      return;
    }
    try {
      await form.validateFields();
      advanceTo("shirt");
    } catch (errInfo) {
      handleValidateError(errInfo);
    }
  };

  const afterShirt = () => (hasQuestionStep ? "questions" : "shipping");

  const confirmShirt = async () => {
    try {
      const current = form.getFieldValue("applicants") || [];
      await form.validateFields(applicantList.flatMap((_a, i) => shirtFieldPaths(event, current[i], i)));
      advanceTo(afterShirt());
    } catch (errInfo) {
      handleValidateError(errInfo);
    }
  };

  const confirmQuestions = async () => {
    try {
      await form.validateFields();
      advanceTo("shipping");
    } catch (errInfo) {
      handleValidateError(errInfo);
    }
  };

  // Picture answers are uploaded here, once, and stored as their public URL.
  const uploadImageAnswers = async (applicants) => {
    const out = [];
    for (const a of applicants) {
      const answers = { ...(a.selectionAnswers || {}) };
      for (const q of questionsFor(event, a.eventTypeId)) {
        if (q.type !== "IMAGE") continue;
        const raw = answers[q.id];
        if (raw && typeof raw === "object" && !Array.isArray(raw) && raw.value) continue; // already uploaded
        const fileList = Array.isArray(raw) ? raw : [];
        if (!fileList.length) { delete answers[q.id]; continue; }
        const key = await onUploadFile({ prefix: QUESTIONNAIRE_PREFIX, isPublic: true, fileList });
        if (!key) throw new Error(t("validation.uploadFailed"));
        const url = await getPublicUrl({ key, prefix: QUESTIONNAIRE_PREFIX, isPublic: true });
        answers[q.id] = { value: url || key };
      }
      out.push({ ...a, selectionAnswers: answers });
    }
    return out;
  };

  // The address this order ships to, or null when postal delivery isn't chosen.
  // Validates the new-address fields when the runner is typing one.
  const resolveShipping = async () => {
    if (deliveryMethod !== "post") return null;
    if (addressMode === "saved" && savedAddress) return savedAddress;
    try {
      await form.validateFields(SHIPPING_KEYS.map((k) => ["shipping", k]));
    } catch (errInfo) {
      handleValidateError(errInfo);
      return false;
    }
    const v = form.getFieldValue("shipping") || {};
    const out = {};
    SHIPPING_KEYS.forEach((k) => { out[k] = String(v[k] || "").trim(); });
    if (!out.shippingAddress) {
      message.warning(t("front.reg.fillAddress"));
      return false;
    }
    return out;
  };

  const confirmShipping = async () => {
    const shipping = await resolveShipping();
    if (shipping === false) return;
    if (hasAddOns) {
      advanceTo("addons");
      return;
    }
    checkout();
  };

  const setAddOnSelection = (addOnId, selection) =>
    setAddOnSelections((prev) => ({ ...prev, [addOnId]: selection }));

  const [checkingOut, setCheckingOut] = useState(false);
  const checkout = async () => {
    const shipping = await resolveShipping();
    if (shipping === false) return;
    const missingNote = firstMissingAddOnNote(addOns, addOnSelections);
    if (missingNote) {
      message.warning(`${missingNote.name}: ${missingNote.noteLabel}`);
      return;
    }
    const raw = form.getFieldValue("applicants") || [];
    // the team name typed on the team header (member 1) belongs to every member
    const teamNames = {};
    raw.forEach((a) => { if (a?.teamGroup && a.teamClub && !teamNames[a.teamGroup]) teamNames[a.teamGroup] = a.teamClub; });
    let withDelivery = raw.map((a, i) => ({
      ...a,
      teamClub: a?.teamGroup ? (teamNames[a.teamGroup] || a.teamClub) : a.teamClub,
      deliveryMethod,
      // flat shipping fee charged once for the single shipment
      shippingFee: deliveryMethod === "post" && i === 0 ? shippingFee : 0,
      ...(shipping || {}),
    }));
    try {
      setCheckingOut(true);
      withDelivery = await uploadImageAnswers(withDelivery);
    } catch (e) {
      message.error(e?.message || t("validation.uploadFailed"));
      return;
    } finally {
      setCheckingOut(false);
    }
    const finalApplicants = finalizeApplicants(withDelivery, event, t);

    dispatch(SET_PROPS({ id: "eventData", payload: event }));
    dispatch(SET_ORDER({
      applicants: finalApplicants,
      addOns: buildAddOnOrder(addOns, addOnSelections),
      eventConditions,
      eventId: event.id,
      eventData: event,
      // What the form looked like, so "Back" on the review page can restore it.
      draft: {
        applicants: raw,
        tickets,
        deliveryMethod,
        addressMode,
        shipping: form.getFieldValue("shipping") || {},
        addOnSelections,
      },
    }));
    navigate("/registrationDetail");
  };

  const primaryAction = () => {
    if (openSection === "tickets") return confirmTickets();
    if (openSection === "info") return confirmInfo();
    if (openSection === "shirt") return confirmShirt();
    if (openSection === "questions") return confirmQuestions();
    if (openSection === "shipping") return confirmShipping();
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

  const stepLabels = [
    t("front.reg.stepTickets"), t("front.reg.stepInfo"), t("front.reg.stepShirt"),
    ...(hasQuestionStep ? [t("front.reg.stepQuestions")] : []),
    t("front.reg.stepShipping"),
    ...(hasAddOns ? [t("front.reg.stepAddons")] : []),
  ];
  const stepNo = (id) => SECTIONS.indexOf(id) + 1;
  const nextLabel = (<>{t("front.reg.next")} <ArrowRightOutlined /></>);
  const checkoutLabel = (<>{t("front.reg.checkout")} <ShoppingCartOutlined /></>);

  return (
    <FrontLayout fullWidth>
      <div className="bg-[#f7fafc]">
        <div className="max-w-screen-md mx-auto py-5 pb-24">
          {/* event header */}
          <div className="mb-5 border-l-4 border-[#fe9400] pl-4">
            <h2 className="text-2xl font-bold text-[#181c1e] mb-1">{event?.name}</h2>
            <p className="text-sm font-bold text-[#3f4850] flex items-center gap-2">
              📅 {event?.eventDate ? dayjs(event.eventDate).format("D MMM YYYY") : ""}
              {event?.location ? ` • ${event.location}` : ""}
            </p>
          </div>

          {/* stepper */}
          <div className="flex items-center justify-between mb-6 px-1">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i <= maxReached ? "bg-[#006193] text-white" : "bg-[#e0e3e5] text-[#3f4850]"}`}>{i + 1}</div>
                  <span className={`text-xs font-bold ${i <= maxReached ? "text-[#006193]" : "text-[#3f4850] opacity-60"}`}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && <div className={`flex-1 h-[2px] mx-2 -mt-5 ${i < maxReached ? "bg-[#006193]" : "bg-[#bfc7d2]"}`} />}
              </div>
            ))}
          </div>

          {/* Sections bleed to the screen edge on phones (the layout adds 16px side padding). */}
          <CommonForm form={form} className="-mx-4 md:mx-0">
            {/* SECTION 1 — tickets */}
            <Section id="tickets" step={1} open={openSection === "tickets"} reached
              title={`1. ${t("front.reg.secTickets")}`} onToggle={goTo}>
              <div className="space-y-3">
                {eventTypeRows.map((et) => {
                  const qty = tickets[et.id] || 0;
                  return (
                    <div key={et.id}
                      className={`border px-3 py-3 rounded-lg flex justify-between items-center gap-3 transition-all ${
                        et._closed ? "border-[#bfc7d2] bg-[#f1f4f6] opacity-80"
                          : qty > 0 ? "border-[#006193] border-2" : "border-[#bfc7d2]"}`}>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-[#181c1e] truncate" title={et.name}>{et.name}</h3>
                        {et._closed ? (
                          <p className="text-sm font-bold text-[#ba1a1a]">{t("front.reg.closed")}</p>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-wrap">
                              {et._special && et._paymentName ? (
                                <span className={phaseBadgeCls}>{et._paymentName}</span>
                              ) : null}
                              {et.isTeam ? (
                                <span className={phaseBadgeCls}>👥 {t("front.reg.teamOf", { n: et._teamSize })}</span>
                              ) : null}
                              <span className="text-[#006193] font-bold">
                                {Number(et._ticketPrice).toLocaleString()} THB{et.isTeam ? ` ${t("front.reg.perTeam")}` : ""}
                              </span>
                            </div>
                            {et.isTeam && et.teamPricing !== "PER_TEAM" ? (
                              <p className="text-xs text-[#3f4850] mt-1">
                                {t("front.reg.perPersonTimes", { price: Number(et._price).toLocaleString(), n: et._teamSize })}
                              </p>
                            ) : null}
                            {!et._available && <p className="text-xs text-[#ba1a1a] mt-1">{t("front.eventDetail.quotaFull")}</p>}
                          </>
                        )}
                      </div>
                      {et._closed ? null : (
                        <div className="flex items-center gap-1.5 bg-[#ebeef0] rounded-full p-0.5 border border-[#bfc7d2] shrink-0">
                          <button type="button" onClick={() => setQty(et.id, -1)} disabled={qty === 0}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[#006193] hover:bg-[#e0e3e5] disabled:text-[#bfc7d2] text-lg font-bold">−</button>
                          <span className="w-5 text-center font-bold text-sm">{qty}</span>
                          <button type="button" onClick={() => setQty(et.id, 1)} disabled={!et._available}
                            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#006193] text-white shadow hover:opacity-90 disabled:bg-[#bfc7d2] text-lg font-bold">+</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button type="button" className={primaryBtn} onClick={confirmTickets}>{nextLabel}</button>
              </div>
            </Section>

            {/* SECTION 2 — athlete info */}
            <Section id="info" step={2} open={openSection === "info"} reached={isReached("info")}
              title={`2. ${t("front.reg.secInfo")}`} onToggle={goTo}>
              <div className="space-y-5">
                {applicantGroups.map((g) => (
                  <div key={g.teamGroup ? `team-${g.teamGroup}` : `solo-${g.items[0].i}`}
                    className={g.teamGroup ? "rounded-2xl border-2 border-[#006193] p-3 space-y-4 bg-[#f7fafc]" : "space-y-5"}>
                    {g.teamGroup ? (
                      <div className="rounded-xl bg-white border border-[#bfc7d2] px-4 py-3">
                        <div className="font-bold text-[#006193] mb-2">👥 {t("front.reg.teamNo", { n: g.teamGroup })} · {g.eventTypeName}</div>
                        <label className="block text-sm font-bold text-[#3f4850] mb-1">
                          {t("front.reg.teamName")} <span className="text-[#ba1a1a]">*</span>
                        </label>
                        <CommonForm.Item name={["applicants", g.items[0].i, "teamClub"]} className={fieldItemCls}
                          rules={[{ required: true, message: t("required.teamClub") }]}>
                          <Input className={inputCls} placeholder={t("front.reg.enterTeamName")} allowClear />
                        </CommonForm.Item>
                      </div>
                    ) : null}
                    {g.items.map(({ a, i }) => (
                      <ApplicantForm key={i} index={i} me={me} event={event}
                        ticketLabel={a?.teamGroup
                          ? `${a.eventTypeName} · ${t("front.reg.memberNo", { i: a.teamIndex, n: a.teamSize })}`
                          : a?.eventTypeName}
                        form={form} provinceOption={provinceOption} isLoadingProvince={isLoadingProvince}
                        nationalityOption={nationalityOption} isLoadingNationality={isLoadingNationality}
                        fieldConfig={fieldConfig} isTeamMember={!!a?.teamGroup}
                        canRemove={applicantList.length > 1 && !a?.teamGroup} onRemove={removeApplicant} />
                    ))}
                  </div>
                ))}
                <button type="button" className={primaryBtn} onClick={confirmInfo}>{nextLabel}</button>
              </div>
            </Section>

            {/* SECTION 3 — shirt */}
            <Section id="shirt" step={3} open={openSection === "shirt"} reached={isReached("shirt")}
              title={`3. ${t("front.reg.secShirt")}`} onToggle={goTo}>
              <div className="space-y-5">
                {applicantList.map((a, i) => (
                  <ShirtPicker key={i} index={i} ticketLabel={a?.eventTypeName} event={event} form={form}
                    eventTypeId={a?.eventTypeId} />
                ))}
                <button type="button" className={primaryBtn} onClick={confirmShirt}>
                  {t("front.reg.completeSelection")} <CheckCircleOutlined />
                </button>
              </div>
            </Section>

            {/* SECTION — extra questions / sponsor questionnaires (only when the event has any) */}
            {hasQuestionStep ? (
              <Section id="questions" step={stepNo("questions")} open={openSection === "questions"} reached={isReached("questions")}
                title={`${stepNo("questions")}. ${t("front.reg.secQuestions")}`} onToggle={goTo}>
                <div className="space-y-5">
                  {applicantList.map((a, i) => (
                    <QuestionnaireStep key={i} index={i} ticketLabel={a?.eventTypeName} event={event}
                      eventTypeId={a?.eventTypeId} lang={i18n.language} />
                  ))}
                  <button type="button" className={primaryBtn} onClick={confirmQuestions}>{nextLabel}</button>
                </div>
              </Section>
            ) : null}

            {/* SECTION — shipping */}
            <Section id="shipping" step={stepNo("shipping")} open={openSection === "shipping"} reached={isReached("shipping")}
              title={`${stepNo("shipping")}. ${t("front.reg.secShipping")}`} onToggle={goTo}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#3f4850] mb-3">{t("front.reg.shippingMethod")}</label>
                  <div className="grid grid-cols-1 gap-3">
                    <button type="button" onClick={() => setDeliveryMethod("pickup")}
                      className={`flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all ${
                        deliveryMethod === "pickup" ? "border-[#006193] bg-[#cce5ff]" : "border-[#bfc7d2] bg-white hover:border-[#006193]"}`}>
                      <EnvironmentOutlined className="text-2xl text-[#006193]" />
                      <div className="flex-1">
                        <div className="font-bold text-[#006193]">{t("front.reg.pickup")}</div>
                        <div className="text-xs text-[#006193]/70">{t("front.reg.pickupHint")}</div>
                      </div>
                      {deliveryMethod === "pickup" && <CheckCircleOutlined className="text-[#006193]" />}
                    </button>

                    {shippingFee != null && (
                      <button type="button" onClick={() => setDeliveryMethod("post")}
                        className={`flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all ${
                          deliveryMethod === "post" ? "border-[#006193] bg-[#cce5ff]" : "border-[#bfc7d2] bg-white hover:border-[#006193]"}`}>
                        <CarOutlined className="text-2xl text-[#006193]" />
                        <div className="flex-1">
                          <div className="font-bold text-[#181c1e]">{t("front.reg.post")}</div>
                          <div className="text-xs text-[#3f4850]">
                            {shippingFee === 0 ? t("back.reg.payment.free") : t("front.reg.shippingFee", { fee: Number(shippingFee).toLocaleString() })}
                          </div>
                        </div>
                        {deliveryMethod === "post" && <CheckCircleOutlined className="text-[#006193]" />}
                      </button>
                    )}
                  </div>
                </div>

                {deliveryMethod === "post" && (
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-[#3f4850]">
                      {t("front.reg.shippingAddress")} <span className="text-[#ba1a1a]">*</span>
                    </label>

                    {/* saved address vs. a new one */}
                    {savedAddress ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setAddressMode("saved")}
                          className={`flex flex-col items-center justify-center gap-1 py-3 border-2 rounded-xl text-sm font-bold transition-all ${
                            addressMode === "saved" ? "border-[#006193] bg-[#cce5ff] text-[#006193]" : "border-[#bfc7d2] bg-white text-[#3f4850]"}`}>
                          <HomeOutlined className="text-xl" />{t("front.reg.useSavedAddress")}
                        </button>
                        <button type="button" onClick={() => setAddressMode("new")}
                          className={`flex flex-col items-center justify-center gap-1 py-3 border-2 rounded-xl text-sm font-bold transition-all ${
                            addressMode === "new" ? "border-[#006193] bg-[#cce5ff] text-[#006193]" : "border-[#bfc7d2] bg-white text-[#3f4850]"}`}>
                          <EditOutlined className="text-xl" />{t("front.reg.newAddress")}
                        </button>
                      </div>
                    ) : null}

                    {addressMode === "saved" && savedAddress ? (
                      <div className="rounded-xl border border-[#bfc7d2] bg-[#f1f4f6] px-4 py-3">
                        <div className="text-[11px] font-bold text-[#3f4850] mb-1">{t("front.reg.savedAddressHint")}</div>
                        <div className="text-sm text-[#181c1e] leading-relaxed">{formatAddress(savedAddress, t)}</div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <CommonForm.Item name={["shipping", "shippingAddress"]} className={fieldItemCls}
                          rules={[{ required: true, message: t("back.reg.payment.enterAddress") }]}>
                          <Input className={inputCls} placeholder={t("front.reg.enterAddressLine")} allowClear />
                        </CommonForm.Item>
                        <ProvinceSelector
                          form={form}
                          basePath={["shipping"]}
                          required
                          compact
                          fieldNames={{ zipcode: "shippingZipcode", province: "shippingProvince", amphoe: "shippingAmphoe", district: "shippingDistrict" }}
                          valueMode={{ province: "nameTh", amphoe: "nameTh", district: "nameTh" }}
                          labels={{
                            zipcode: t("back.reg.payment.zipcode"),
                            province: t("back.reg.payment.province"),
                            amphoe: t("back.reg.payment.amphoe"),
                            district: t("back.reg.payment.district"),
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                <button type="button" className={primaryBtn} onClick={confirmShipping}>
                  {hasAddOns ? nextLabel : checkoutLabel}
                </button>
              </div>
            </Section>

            {/* SECTION 5 — optional packages the organizer sells (hotel, photos…) */}
            {hasAddOns ? (
              <Section id="addons" step={stepNo("addons")} open={openSection === "addons"} reached={isReached("addons")}
                title={`${stepNo("addons")}. ${t("front.reg.secAddons")}`} onToggle={goTo}>
                <div className="space-y-5">
                  <AddOnPicker
                    addOns={addOns}
                    applicants={applicantList}
                    selections={addOnSelections}
                    onChange={setAddOnSelection}
                    lang={i18n.language}
                  />

                  {totalAddOns > 0 ? (
                    <div className="flex justify-between items-center px-4 py-3 rounded-lg bg-[#f1f4f6] border border-[#bfc7d2]">
                      <span className="font-bold text-[#3f4850]">{t("back.reg.addOn.total")}</span>
                      <span className="font-bold text-[#006193]">{fmt(totalAddOns)} THB</span>
                    </div>
                  ) : null}

                  <button type="button" className={primaryBtn} onClick={checkout}>{checkoutLabel}</button>
                  <p className="text-xs text-center text-[#3f4850]">{t("back.reg.addOn.skipHint")}</p>
                </div>
              </Section>
            ) : null}
          </CommonForm>
        </div>
      </div>

      {/* sticky total bar — compact so it doesn't eat the phone screen */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-[#bfc7d2] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-50">
        <div className="max-w-screen-md mx-auto px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex flex-col leading-tight">
            <span className="text-[11px] text-[#3f4850]">{t("front.reg.totalPayment")}</span>
            <span className="text-lg font-bold text-[#006193]">{fmt(grandTotal)} THB</span>
          </div>
          <button type="button" onClick={primaryAction} disabled={checkingOut}
            className="bg-[#fe9400] text-[#633700] font-bold px-6 h-10 rounded-full flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform disabled:opacity-60">
            {openSection === lastSection ? t("front.reg.checkout") : t("front.reg.next")}
            {openSection === lastSection ? <ShoppingCartOutlined /> : <ArrowRightOutlined />}
          </button>
        </div>
      </div>
    </FrontLayout>
  );
};

export default StreamlinedRegistration;
