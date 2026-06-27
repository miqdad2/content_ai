import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { deleteAvatar, fetchAvatars, type Avatar } from "@/lib/api";
import { AvatarForm } from "@/components/AvatarForm";
import { MyAvatars } from "@/components/MyAvatars";
import { SignedOut } from "@/components/SignedOut";
import { PageHeader } from "@/components/PageHeader";

export function AvatarPage() {
  const { data: session, isPending } = useSession();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAvatars = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAvatars()
      .then(setAvatars)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (session?.user) loadAvatars();
  }, [session?.user, loadAvatars]);

  async function handleDelete(id: string) {
    setAvatars((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteAvatar(id);
    } catch {
      loadAvatars();
    }
  }

  if (isPending) return null;
  if (!session?.user) return <SignedOut />;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-10">
      <PageHeader
        eyebrow="Avatar vault"
        title="Keep reusable avatar photos ready for templates."
        description="Upload one or two photos, then pick those avatars when rendering personalized videos from templates."
      />
      <div className="rounded-[2rem] border bg-card/80 p-4 shadow-xl shadow-violet-950/5 backdrop-blur sm:p-6">
        <AvatarForm
          onCreated={(avatar) => setAvatars((prev) => [avatar, ...prev])}
        />
      </div>
      <div className="rounded-[2rem] border bg-card/80 p-4 shadow-xl shadow-violet-950/5 backdrop-blur sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">My avatars</h2>
        <MyAvatars
          avatars={avatars}
          loading={loading}
          error={error}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
