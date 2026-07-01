import { useCallback, useEffect, useState } from "react";
import { fetchMe, type Me } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

/** Event other components can dispatch to make the cached `me` (credits) refresh. */
export const CREDITS_REFRESH_EVENT = "credits:refresh";

/** Tell any mounted `useMe` consumers to re-fetch the profile + credit balance. */
export function refreshCredits() {
  window.dispatchEvent(new Event(CREDITS_REFRESH_EVENT));
}

/** Loads the current user's profile + admin flag + credits (null while unknown). */
export function useMe(): { me: Me | null; loading: boolean; refresh: () => void } {
  const { data: session } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);

  // `background` refreshes (focus/credits events) must NOT toggle `loading`.
  // `loading` gates full-page renders in some consumers, so flipping it on every
  // window focus would unmount the page mid-interaction (e.g. it would tear down
  // the admin editor + its hidden file inputs right as a file dialog closes,
  // dropping the upload's change event). Only the initial load shows loading.
  const load = useCallback(
    (background = false) => {
      if (!session?.user) {
        setMe(null);
        return;
      }
      if (!background) setLoading(true);
      fetchMe()
        .then(setMe)
        .catch(() => setMe(null))
        .finally(() => {
          if (!background) setLoading(false);
        });
    },
    [session?.user],
  );

  useEffect(() => {
    load();
  }, [load]);

  // Refresh when credits change (e.g. after a purchase or generation) or the
  // tab regains focus, so the navbar balance stays up to date — but as a
  // background refresh that never flips `loading`.
  useEffect(() => {
    if (!session?.user) return;
    const onRefresh = () => load(true);
    window.addEventListener(CREDITS_REFRESH_EVENT, onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => {
      window.removeEventListener(CREDITS_REFRESH_EVENT, onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, [session?.user, load]);

  const refresh = useCallback(() => load(false), [load]);

  return { me, loading, refresh };
}
