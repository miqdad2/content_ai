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

  const load = useCallback(() => {
    if (!session?.user) {
      setMe(null);
      return;
    }
    setLoading(true);
    fetchMe()
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, [session?.user]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh when credits change (e.g. after a purchase or generation) or the
  // tab regains focus, so the navbar balance stays up to date.
  useEffect(() => {
    if (!session?.user) return;
    const onRefresh = () => load();
    window.addEventListener(CREDITS_REFRESH_EVENT, onRefresh);
    window.addEventListener("focus", onRefresh);
    return () => {
      window.removeEventListener(CREDITS_REFRESH_EVENT, onRefresh);
      window.removeEventListener("focus", onRefresh);
    };
  }, [session?.user, load]);

  return { me, loading, refresh: load };
}
