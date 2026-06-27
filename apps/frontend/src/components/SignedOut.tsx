import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";

export function SignedOut() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:py-28">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-sm text-muted-foreground shadow-sm backdrop-blur">
        <Sparkles className="h-4 w-4 text-primary" />
        Sign in to unlock the studio
      </div>
      <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
        Generate videos, images and template renders from one creative
        workspace.
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
        Create AI videos with model controls, reference frames, reusable avatars
        and a personal generation library.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="rounded-full px-6"
          onClick={() => setOpen(true)}
        >
          Get started
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="rounded-full bg-background/60 px-6"
        >
          <Link to="/">View landing page</Link>
        </Button>
      </div>
      <AuthModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
