import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import {
  fetchTemplateRenders,
  fetchTemplates,
  type Template,
  type TemplateRender,
} from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemplateGallery } from "@/components/TemplateGallery";
import { MyTemplateRenders } from "@/components/MyTemplateRenders";
import { SignedOut } from "@/components/SignedOut";

export function TemplatesPage() {
  const { data: session, isPending } = useSession();
  const [tab, setTab] = useState("browse");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const [renders, setRenders] = useState<TemplateRender[]>([]);
  const [rendersLoading, setRendersLoading] = useState(false);
  const [rendersError, setRendersError] = useState<string | null>(null);

  const loadTemplates = useCallback(() => {
    setTemplatesLoading(true);
    setTemplatesError(null);
    fetchTemplates()
      .then(setTemplates)
      .catch((err) => setTemplatesError(err.message))
      .finally(() => setTemplatesLoading(false));
  }, []);

  const loadRenders = useCallback(() => {
    setRendersLoading(true);
    setRendersError(null);
    fetchTemplateRenders()
      .then(setRenders)
      .catch((err) => setRendersError(err.message))
      .finally(() => setRendersLoading(false));
  }, []);

  useEffect(() => {
    if (session?.user) loadTemplates();
  }, [session?.user, loadTemplates]);

  if (isPending) return null;
  if (!session?.user) return <SignedOut />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Templates</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="library" onClick={loadRenders}>
            My Videos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <TemplateGallery
            templates={templates}
            loading={templatesLoading}
            error={templatesError}
            onRendered={(render) => {
              setRenders((prev) => [render, ...prev]);
              setTab("library");
            }}
          />
        </TabsContent>

        <TabsContent value="library">
          <MyTemplateRenders renders={renders} loading={rendersLoading} error={rendersError} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
