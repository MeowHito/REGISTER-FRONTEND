import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import useMe from "hooks/useMe";
import { CLEAR_ACTIVE_EVENT, SET_ACTIVE_EVENT } from "store/reducers/workspaceSlice";

/**
 * The event the current back-office user has starred. Pages that deal with a
 * single event (event management, coupons, reports, dashboard stats) scope
 * themselves to it; with nothing starred they show every event as before.
 *
 * Shape: { id, name, organizerId } or null.
 */
export default function useActiveEvent() {
  const dispatch = useDispatch();
  const { data: me } = useMe({ retry: 0 });
  const userId = me?.id;

  const activeEvent = useSelector((state) => (userId && state.workspace?.byUser?.[userId]) || null);

  const setActiveEvent = useCallback(
    (event) => {
      if (!event?.id) return;
      dispatch(SET_ACTIVE_EVENT({
        userId,
        event: { id: event.id, name: event.name, organizerId: event.organizerId ?? null },
      }));
    },
    [dispatch, userId]
  );

  const clearActiveEvent = useCallback(() => dispatch(CLEAR_ACTIVE_EVENT(userId)), [dispatch, userId]);

  // Star an event, or un-star it when it is already the active one.
  const toggleActiveEvent = useCallback(
    (event) => (activeEvent?.id === event?.id ? clearActiveEvent() : setActiveEvent(event)),
    [activeEvent?.id, clearActiveEvent, setActiveEvent]
  );

  return { activeEvent, setActiveEvent, clearActiveEvent, toggleActiveEvent };
}
