import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { deleteAvatar, fetchAvatars, type Avatar } from "@/lib/api";
import { AvatarForm } from "@/components/AvatarForm";
import { MyAvatars } from "@/components/MyAvatars";
import { SignedOut } from "@/components/SignedOut";

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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-semibold">Your avatars</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Upload 1-2 photos of yourself to create an avatar. Pick it when generating a video from a
        template and we&apos;ll put your likeness into the result.
      </p>
      <AvatarForm onCreated={(avatar) => setAvatars((prev) => [avatar, ...prev])} />
      <div className="mt-10">
        <h2 className="mb-4 text-lg font-medium">My avatars</h2>
        <MyAvatars avatars={avatars} loading={loading} error={error} onDelete={handleDelete} />
      </div>
    </div>
  );
}
