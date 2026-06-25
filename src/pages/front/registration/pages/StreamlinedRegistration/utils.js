import dayjs from "dayjs";

/**
 * Re-shape the raw form `applicants` array into the exact `order.applicants`
 * structure expected by RegistrationDetail / createOrder. Logic mirrors
 * RegistrationInfo.onFinish so the downstream flow is fully reused.
 */
export const finalizeApplicants = (rawApplicants, event, t) => {
  const applicants = rawApplicants || [];
  const globalFields = event?.selectionFields || [];
  const allEventTypes = event?.eventTypes || [];

  return applicants.map((applicantInput) => {
    const applicant = { ...applicantInput };
    const eventTypeId = applicant.eventTypeId;
    const selectedEventType = allEventTypes.find((et) => et.id === eventTypeId);
    const eventTypeFields = selectedEventType?.selectionFields || [];
    const allFields = [...globalFields, ...eventTypeFields];

    // ---- age group label ----
    const age = dayjs().year() - dayjs(applicant.birthDate).year();
    const matchedGroup = selectedEventType?.ageGroups?.find(
      (group) =>
        group.gender === applicant.gender &&
        ((age >= group.minAge && age <= group.maxAge) ||
          (age >= group.minAge && group.maxAge === null) ||
          (age <= group.maxAge && group.minAge === null))
    );
    const { minAge, maxAge } = matchedGroup || {};

    if (minAge != null && maxAge != null) {
      applicant.ageGroupName = `${t("front.eventDetail.age")} ${minAge} - ${maxAge} ${t("front.eventDetail.year")}`;
    } else if (minAge != null) {
      applicant.ageGroupName = `${t("front.eventDetail.age")} ${minAge} ${t("front.eventDetail.orMore")}`;
    } else if (maxAge != null) {
      applicant.ageGroupName = `${t("front.eventDetail.age")}${t("front.eventDetail.notOver")} ${maxAge} ${t("front.eventDetail.year")}`;
    } else {
      applicant.ageGroupName = t("back.reg.form.noCompetitiveAgeGroup");
    }

    // ---- structure selection answers ----
    const answers = applicant.selectionAnswers || {};
    const structuredAnswers = Object.entries(answers)
      .map(([questionKey, answerRaw]) => {
        const field = allFields.find(
          (f) => f.id === questionKey || f.title === questionKey
        );
        if (!field) return null;

        const question = {
          id: field.id,
          value: field.title,
          valueEn: field.titleEn,
        };

        const formatOption = (optId) => {
          const opt = field.options.find((o) => o.id === optId);
          return opt
            ? {
                id: opt.id,
                value: opt.value,
                valueEn: opt.valueEn,
                inputType: opt.inputType,
              }
            : null;
        };

        if (typeof answerRaw === "object" && answerRaw?.selected !== undefined) {
          const selectedRaw = answerRaw.selected;
          const freeTextValues = answerRaw.freeTextValues || {};

          if (Array.isArray(selectedRaw)) {
            const value = selectedRaw
              .map((optId) => {
                const opt = formatOption(optId);
                if (!opt) return null;
                if (opt.inputType === "FREE_TEXT" && freeTextValues[optId]) {
                  return { ...opt, freeTextValue: freeTextValues[optId] };
                }
                return opt;
              })
              .filter(Boolean);
            return { question, value };
          }

          const selectedOpt = formatOption(selectedRaw);
          if (selectedOpt?.inputType === "FREE_TEXT" && answerRaw.freeText) {
            return {
              question,
              value: { ...selectedOpt, freeTextValue: answerRaw.freeText },
            };
          }
          return { question, value: selectedOpt };
        }

        let value;
        if (Array.isArray(answerRaw)) {
          value = answerRaw
            .map((a) => (typeof a === "object" && a.id ? a : formatOption(a)))
            .filter(Boolean);
        } else {
          value =
            typeof answerRaw === "object" && answerRaw.id
              ? answerRaw
              : formatOption(answerRaw);
        }

        return { question, value };
      })
      .filter(Boolean);

    applicant.selectionAnswers = structuredAnswers;
    return applicant;
  });
};

/** Sum of all ticket quantities. */
export const totalQty = (tickets) =>
  Object.values(tickets || {}).reduce((sum, q) => sum + (Number(q) || 0), 0);

/**
 * Registration for an event type is "closed" when the admin configured payment
 * phases (pricing rows) but every one of them has already passed its end date —
 * i.e. there is no current phase and no next phase to fall through to. Event
 * types with no payment phases at all keep working on the Standard price.
 */
export const isEventTypeClosed = (eventType) => {
  const pricing = eventType?.pricing || [];
  if (!pricing.length) return false;
  const now = dayjs();
  return pricing.every((p) => p.endDate && dayjs(p.endDate).isBefore(now));
};

/** Resolve the current price for an event type, preferring live availability. */
export const resolvePricing = (eventType, availability) => {
  const closed = isEventTypeClosed(eventType);
  const info = (availability || []).find(
    (a) => a.eventTypeId === eventType.id
  );
  if (info && info.currentPrice != null) {
    return {
      price: info.currentPrice,
      paymentName: info.paymentName ?? null,
      pricingId: info.isSpecialPrice ? info.pricingId ?? null : null,
      isSpecialPrice: !!info.isSpecialPrice,
      isAvailable: !closed && (info.isAvailable ?? true),
      availableQuota: info.availableQuota ?? null,
      isClosed: closed,
    };
  }
  return {
    price: eventType.price ?? 0,
    paymentName: null,
    pricingId: null,
    isSpecialPrice: false,
    isAvailable: !closed && !eventType.isQuotaFull,
    availableQuota: null,
    isClosed: closed,
  };
};
