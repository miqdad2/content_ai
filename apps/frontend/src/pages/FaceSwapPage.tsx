import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { fetchFaceSwaps, type FaceSwap } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FaceSwapForm } from "@/components/FaceSwapForm";
import { MyFaceSwaps } from "@/components/MyFaceSwaps";
import { SignedOut } from "@/components/SignedOut";

export function FaceSwapPage() {
  const { data: session, isPending } = useSession();
  const [tab, setTab] = useState("create");
  const [swaps, setSwaps] = useState<FaceSwap[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSwaps = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchFaceSwaps()
      .then(setSwaps)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (session?.user) loadSwaps();
  }, [session?.user, loadSwaps]);

  if (isPending) return null;
  if (!session?.user) return <SignedOut />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Face swap</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="library" onClick={loadSwaps}>
            My Swaps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <FaceSwapForm
            onCreated={(swap) => {
              setSwaps((prev) => [swap, ...prev]);
              setTab("library");
            }}
          />
        </TabsContent>

        <TabsContent value="library">
          <MyFaceSwaps swaps={swaps} loading={loading} error={error} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
