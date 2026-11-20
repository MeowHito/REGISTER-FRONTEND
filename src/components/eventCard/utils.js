// Open-for-registration first, then coming soon, then closed. A stable sort, so each group keeps
// the order the server sent (newest first).
const STATUS_RANK = { openRegistration: 0, soon: 1, closedRegistration: 2 };

export const sortOpenFirst = (events = []) =>
  events
    .map((e, i) => [e, i])
    .sort(([a, ia], [b, ib]) =>
      (STATUS_RANK[a?.eventStatus] ?? 1) - (STATUS_RANK[b?.eventStatus] ?? 1) || ia - ib)
    .map(([e]) => e);

// "Half Marathon 21.1 KM" -> "21.1 km". A name with no distance in it is shown as it is.
const DISTANCE = /(\d+(?:[.,]\d+)?)\s*(km|k|กม\.?|กิโล)(?![a-z])/i;

export const distanceLabel = (name = "") => {
  const m = String(name).match(DISTANCE);
  return m ? `${m[1].replace(",", ".")} km` : String(name).trim();
};

/** Unique chip labels for a card, in the organizer's order. */
export const distanceChips = (distances = []) => [...new Set((distances || []).map(distanceLabel).filter(Boolean))];
