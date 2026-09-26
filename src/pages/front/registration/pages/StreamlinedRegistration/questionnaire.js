/** Every question this applicant must see: event-wide ones, then the distance's own ones. */
export const questionsFor = (event, eventTypeId) => {
  const et = (event?.eventTypes || []).find((e) => e.id === eventTypeId);
  return [...(event?.selectionFields || []), ...(et?.selectionFields || [])];
};

export const hasQuestions = (event, applicants) =>
  (applicants || []).some((a) => questionsFor(event, a?.eventTypeId).length > 0);

