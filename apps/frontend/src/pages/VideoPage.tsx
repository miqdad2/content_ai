import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { fetchVideos, type Video } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextToVideoForm } from "@/components/TextToVideoForm";
import { MyVideos } from "@/components/MyVideos";
import { SignedOut } from "@/components/SignedOut";

export function VideoPage() {
  const { data: session, isPending } = useSession();
  const [tab, setTab] = useState("create");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVideos = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchVideos()
      .then(setVideos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (session?.user) loadVideos();
  }, [session?.user, loadVideos]);

  if (isPending) return null;
  if (!session?.user) return <SignedOut />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Create a video</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="create">Text to Video</TabsTrigger>
          <TabsTrigger value="library" onClick={loadVideos}>
            My Videos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <TextToVideoForm
            onCreated={(video) => {
              setVideos((prev) => [video, ...prev]);
              setTab("library");
            }}
          />
        </TabsContent>

        <TabsContent value="library">
          <MyVideos videos={videos} loading={loading} error={error} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
