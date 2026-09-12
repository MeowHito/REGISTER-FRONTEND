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

/**
 * Count how many units of an add-on the current selection buys: the quantity
 * for a per-order add-on, or the number of runners ticked for a per-applicant one.
 */
export const addOnPickedCount = (addOn, selection) => {
  if (!selection) return 0;
  if (addOn?.perApplicant) {
    return Object.values(selection.applicants || {}).filter(Boolean).length;
  }
  return Number(selection.qty) || 0;
};

/**
 * Add-ons to show a buyer, in the organizer's order. Sold-out ones stay on the
 * list (greyed out by the picker) — hiding them just makes people wonder where
 * the hotel they were told about went.
 */
export const sellableAddOns = (event) =>
  (event?.addOns || [])
    .filter((a) => a.active !== false)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

/**
 * Flatten the picker's selection state into order lines. A per-applicant add-on
 * produces one line per ticked runner (carrying that runner's index, which is
 * how the backend attaches it to the right orderDetail); a per-order add-on
 * produces a single line with a quantity.
 */
export const buildAddOnOrder = (addOns, selections) => {
  const lines = [];

  (addOns || []).forEach((addOn) => {
    const selection = (selections || {})[addOn.id];
    const count = addOnPickedCount(addOn, selection);
    if (count < 1) return;

    const unitPrice = Number(addOn.price) || 0;
    const note = selection?.note?.trim() || undefined;
    const base = {
      addOnId: addOn.id,
      name: addOn.name,
      nameEn: addOn.nameEn,
      unitPrice,
      note,
      perApplicant: !!addOn.perApplicant,
    };

    if (addOn.perApplicant) {
      Object.entries(selection.applicants || {})
        .filter(([, on]) => on)
        .map(([index]) => Number(index))
        .sort((a, b) => a - b)
        .forEach((applicantIndex) => {
          lines.push({ ...base, applicantIndex, qty: 1, totalPrice: unitPrice });
        });
    } else {
      lines.push({ ...base, applicantIndex: null, qty: count, totalPrice: unitPrice * count });
    }
  });

  return lines;
};

/** What the picked add-ons come to. */
export const addOnsTotal = (addOns, selections) =>
  (addOns || []).reduce(
    (sum, addOn) =>
      sum + addOnPickedCount(addOn, (selections || {})[addOn.id]) * (Number(addOn.price) || 0),
    0
  );

/**
 * First add-on that was picked but whose required note is still blank, so the
 * caller can point the buyer at it. Returns null when everything is filled in.
 */
export const firstMissingAddOnNote = (addOns, selections) =>
  (addOns || []).find((addOn) => {
    if (!addOn.noteRequired || !addOn.noteLabel) return false;
    const selection = (selections || {})[addOn.id];
    if (addOnPickedCount(addOn, selection) < 1) return false;
    return !selection?.note?.trim();
  }) || null;
