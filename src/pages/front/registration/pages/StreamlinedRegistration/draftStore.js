/**
 * Keeps what a runner has typed on the registration page in this browser, so a reload or a
 * dropped connection doesn't send them back to an empty form. One draft per event and user;
 * it is removed once the order is created.
 *
 * Picked-but-not-uploaded photos (File objects) can't be stored, so those fields come back
 * empty; anything already a stored key (e.g. the profile photo) survives.
 */
const PREFIX = "reg-draft:";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const keyOf = (eventId, userId) => `${PREFIX}${eventId}:${userId}`;

const isFileLike = (v) =>
  v && typeof v === "object" &&
  ("originFileObj" in v || (typeof File !== "undefined" && v instanceof File) || (typeof Blob !== "undefined" && v instanceof Blob));

export const saveDraft = (eventId, userId, draft) => {
  if (!eventId || !userId) return;
  try {
    const json = JSON.stringify({ savedAt: Date.now(), draft }, (k, v) => (k === "thumbUrl" || isFileLike(v) ? undefined : v));
    globalThis.localStorage?.setItem(keyOf(eventId, userId), json);
  } catch {
    /* storage full or blocked (private mode): the form still works, it just won't be restored */
  }
};

export const loadDraft = (eventId, userId) => {
  if (!eventId || !userId) return null;
  try {
    const raw = globalThis.localStorage?.getItem(keyOf(eventId, userId));
    if (!raw) return null;
    // Arrays lose their file entries as nulls when stringified; drop those.
    const parsed = JSON.parse(raw, (_k, v) => (Array.isArray(v) ? v.filter((x) => x !== null) : v));
    if (!parsed?.draft || Date.now() - (parsed.savedAt || 0) > MAX_AGE_MS) return null;
    return parsed.draft;
  } catch {
    return null;
  }
};

/** Forget every saved draft for an event (called once its order exists). */
export const clearDrafts = (eventId) => {
  if (!eventId) return;
  try {
    const ls = globalThis.localStorage;
    if (!ls) return;
    Object.keys(ls)
      .filter((k) => k.startsWith(`${PREFIX}${eventId}:`))
      .forEach((k) => ls.removeItem(k));
  } catch {
    /* ignore */
  }
};
