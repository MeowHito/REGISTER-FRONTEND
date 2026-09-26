import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { AlertConfirm } from "components/alert";
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
  const { t } = useTranslation();
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

  // Same as toggleActiveEvent, but replacing or dropping an existing star asks first.
  // Starring the first event needs no confirmation.
  const confirmToggleActiveEvent = useCallback(
    (event) => {
      if (!event?.id) return;
      if (!activeEvent) {
        setActiveEvent(event);
      } else if (activeEvent.id === event.id) {
        AlertConfirm({
          title: t("back.workspace.unstarConfirmTitle"),
          text: t("back.workspace.unstarConfirmText", { name: activeEvent.name }),
          confirmButtonText: t("back.workspace.unstar"),
          cancelButtonText: t("general.cancel"),
          onOk: clearActiveEvent,
        });
      } else {
        AlertConfirm({
          title: t("back.workspace.switchConfirmTitle"),
          text: t("back.workspace.switchConfirmText", { from: activeEvent.name, to: event.name }),
          confirmButtonText: t("back.workspace.switchConfirm"),
          cancelButtonText: t("general.cancel"),
          onOk: () => setActiveEvent(event),
        });
      }
    },
    [activeEvent, clearActiveEvent, setActiveEvent, t]
  );

  return { activeEvent, setActiveEvent, clearActiveEvent, toggleActiveEvent, confirmToggleActiveEvent };
}
