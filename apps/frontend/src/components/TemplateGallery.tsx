import { useState } from "react";
import { Film, Loader2, Wand2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TemplateRenderDialog } from "@/components/TemplateRenderDialog";
import type { Template, TemplateRender } from "@/lib/api";

interface Props {
  templates: Template[];
  loading: boolean;
  error: string | null;
  onRendered: (render: TemplateRender) => void;
}

export function TemplateGallery({ templates, loading, error, onRendered }: Props) {
  const [active, setActive] = useState<Template | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading templates…
      </div>
    );
  }
  if (error) return <p className="py-16 text-center text-destructive">{error}</p>;
  if (templates.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        No templates are available yet. Check back soon.
      </p>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden">
            <div className="aspect-video bg-muted">
              {template.thumbnailUrl ? (
                <img
                  src={template.thumbnailUrl}
                  alt={template.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <Film className="h-8 w-8" />
                </div>
              )}
            </div>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="line-clamp-1 text-base">{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4 pt-0">
              {template.description && (
                <p className="line-clamp-2 text-sm text-muted-foreground">{template.description}</p>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {template.durationSec != null && <span>{Math.round(template.durationSec)}s</span>}
                <span>· {template.blockCount ?? template.blocks?.length ?? 0} clips</span>
                <span>· {template.avatarSlots} avatar(s)</span>
              </div>
              {template.previewVideoUrl && (
                <video src={template.previewVideoUrl} controls className="w-full rounded-md" />
              )}
              <Button className="mt-1 w-full" onClick={() => setActive(template)}>
                <Wand2 className="h-4 w-4" /> Generate with my avatar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {active && (
        <TemplateRenderDialog
          template={active}
          open={!!active}
          onOpenChange={(o) => !o && setActive(null)}
          onRendered={onRendered}
        />
      )}
    </>
  );
}
