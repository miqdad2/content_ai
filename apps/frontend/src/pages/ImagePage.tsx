import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { fetchImages, type Image } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextToImageForm } from "@/components/TextToImageForm";
import { MyImages } from "@/components/MyImages";
import { SignedOut } from "@/components/SignedOut";
import { PageHeader } from "@/components/PageHeader";

export function ImagePage() {
  const { data: session, isPending } = useSession();
  const [tab, setTab] = useState("create");
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadImages = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchImages()
      .then(setImages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (session?.user) loadImages();
  }, [session?.user, loadImages]);

  if (isPending) return null;
  if (!session?.user) return <SignedOut />;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:py-10">
      <PageHeader
        eyebrow="Image lab"
        title="Generate campaign-ready stills and references."
        description="Explore image models, tune the format and reuse reference images to keep your visual direction consistent."
      />
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="rounded-[2rem] border bg-card/80 p-4 shadow-xl shadow-violet-950/5 backdrop-blur sm:p-6"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl bg-muted/70 p-1 sm:w-auto">
          <TabsTrigger value="create">Text to Image</TabsTrigger>
          <TabsTrigger value="library" onClick={loadImages}>
            My Images
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <TextToImageForm
            onCreated={(image) => {
              setImages((prev) => [image, ...prev]);
              setTab("library");
            }}
          />
        </TabsContent>

        <TabsContent value="library">
          <MyImages images={images} loading={loading} error={error} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
