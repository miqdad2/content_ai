import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { fetchVideos, type Video } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextToVideoForm } from "@/components/TextToVideoForm";
import { MyVideos } from "@/components/MyVideos";
import { SignedOut } from "@/components/SignedOut";
import { PageHeader } from "@/components/PageHeader";

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
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-10">
      <PageHeader
        eyebrow="Video studio"
        title="Turn prompts into polished video clips."
        description="Choose a model, duration, frame format and optional reference frames, then keep every generation in your personal library."
      />
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="rounded-[2rem] border bg-card/80 p-4 shadow-xl shadow-violet-950/5 backdrop-blur sm:p-6"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl bg-muted/70 p-1 sm:w-auto">
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
