const TOKEN_MIN_LENGTH = 3;
const NUMERIC_TOKEN_WEIGHT = 0.3;
const CONTAINMENT_MIN_LENGTH = 5;

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const bigrams = (value) => {
  const clean = value.replace(/\s/g, "");
  const set = new Set();
  for (let i = 0; i < clean.length - 1; i++) {
    set.add(clean.slice(i, i + 2));
  }
  return set;
};

const diceCoefficient = (a, b) => {
  if (!a || !b) return 0;
  if (a === b) return 1;

  const first = bigrams(a);
  const second = bigrams(b);
  if (!first.size || !second.size) return 0;

  let overlap = 0;
  first.forEach((gram) => {
    if (second.has(gram)) overlap++;
  });

  return (2 * overlap) / (first.size + second.size);
};

const tokenWeight = (token) => (/^\d+$/.test(token) ? NUMERIC_TOKEN_WEIGHT : 1);

const tokenize = (value) =>
  new Set(value.split(" ").filter((token) => token.length >= TOKEN_MIN_LENGTH));

const totalWeight = (tokens) =>
  [...tokens].reduce((sum, token) => sum + tokenWeight(token), 0);

const tokenSimilarity = (a, b) => {
  const left = tokenize(a);
  const right = tokenize(b);
  if (!left.size || !right.size) return 0;

  let shared = 0;
  left.forEach((token) => {
    if (right.has(token)) shared += tokenWeight(token);
  });

  const total = totalWeight(left) + totalWeight(right);
  return total ? (2 * shared) / total : 0;
};

const containment = (a, b) => {
  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  if (shorter.length < CONTAINMENT_MIN_LENGTH || !longer.includes(shorter)) return 0;
  return 0.6 + 0.35 * (shorter.length / longer.length);
};

export const scoreEventMatch = (slug, event) => {
  const target = normalize(slug);
  if (!target) return 0;

  const candidates = [event?.link, event?.name, event?.id]
    .filter(Boolean)
    .map(normalize)
    .filter(Boolean);

  return candidates.reduce((best, candidate) => {
    const score = Math.max(
      diceCoefficient(target, candidate),
      tokenSimilarity(target, candidate),
      containment(target, candidate)
    );
    return Math.max(best, score);
  }, 0);
};

export const STRONG_MATCH_SCORE = 0.6;

export const findSimilarEvents = (slug, events = [], { limit = 3, threshold = 0.45 } = {}) =>
  events
    .map((event) => ({ event, score: scoreEventMatch(slug, event) }))
    .filter((item) => item.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.event);

export const pickUpcomingEvents = (events = [], limit = 3) => {
  const byDate = (a, b) => new Date(a?.eventDate || 0) - new Date(b?.eventDate || 0);
  const open = events.filter((event) => event?.eventStatus !== "closedRegistration");
  const closed = events.filter((event) => event?.eventStatus === "closedRegistration");

  return [...open.sort(byDate), ...closed.sort(byDate)].slice(0, limit);
};
