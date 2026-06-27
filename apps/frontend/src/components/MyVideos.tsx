import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import type { Video } from "@/lib/api";

interface Props {
  videos: Video[];
  loading: boolean;
  error: string | null;
}

export function MyVideos({ videos, loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your videos…
      </div>
    );
  }

  if (error) {
    return <p className="py-16 text-center text-destructive">{error}</p>;
  }

  if (videos.length === 0) {
    return (
      <p className="py-16 text-center text-muted-foreground">
        You haven&apos;t generated any videos yet. Head to the “Text to Video” tab to create one.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => (
        <Card key={video.id} className="overflow-hidden">
          <div className="aspect-video bg-muted">
            {video.videoUrl ? (
              <video src={video.videoUrl} controls className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {video.status === "FAILED" ? "Generation failed" : "Processing…"}
              </div>
            )}
          </div>
          <CardHeader className="p-4 pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="line-clamp-1 text-sm">{video.model}</CardTitle>
              <StatusBadge status={video.status} />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="line-clamp-2 text-sm text-muted-foreground">{video.prompt}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {video.resolution && <span>{video.resolution}</span>}
              {video.aspectRatio && <span>· {video.aspectRatio}</span>}
              {video.duration && <span>· {video.duration}s</span>}
              {video.generateAudio != null && (
                <span>· {video.generateAudio ? "audio" : "muted"}</span>
              )}
            </div>
            {video.error && <p className="mt-2 text-xs text-destructive">{video.error}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
