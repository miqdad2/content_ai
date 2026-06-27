import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { fetchImages, type Image } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextToImageForm } from "@/components/TextToImageForm";
import { MyImages } from "@/components/MyImages";
import { SignedOut } from "@/components/SignedOut";

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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Create an image</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
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
