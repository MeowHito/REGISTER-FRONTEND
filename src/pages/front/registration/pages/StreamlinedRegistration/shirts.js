/** Shirt-category helpers shared by the picker and the page (kept out of the component file for fast refresh). */
export const SHIRT_CATEGORIES = ["RACE", "FINISHER", "SPECIAL"];

/** Styles the event offers to this distance, grouped by category in display order. */
export const shirtCategoriesFor = (event, eventTypeId) => {
  const styles = (event?.shirtTypes || []).filter((s) => {
    const ids = s.eventTypeIds || [];
    return ids.length === 0 || !eventTypeId || ids.includes(eventTypeId);
  });
  return SHIRT_CATEGORIES
    .map((category) => ({
      category,
      styles: styles
        .filter((s) => (s.category || "RACE") === category)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    }))
    .filter((g) => g.styles.length > 0);
};

/** Form paths that must be valid before the shirt step can be left. */
export const shirtFieldPaths = (event, applicant, index) =>
  shirtCategoriesFor(event, applicant?.eventTypeId).flatMap(({ category }) =>
    category === "RACE"
      ? [["applicants", index, "shirtTypeId"], ["applicants", index, "shirtSizeId"]]
      : [["applicants", index, "extraShirts", category, "shirtTypeId"],
         ["applicants", index, "extraShirts", category, "shirtSizeId"]]
  );

