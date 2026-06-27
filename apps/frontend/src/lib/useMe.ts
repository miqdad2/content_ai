import { useEffect, useState } from "react";
import { fetchMe, type Me } from "@/lib/api";
import { useSession } from "@/lib/auth-client";

/** Loads the current user's profile + admin flag (null while unknown). */
export function useMe(): { me: Me | null; loading: boolean } {
  const { data: session } = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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

  return { me, loading };
}
