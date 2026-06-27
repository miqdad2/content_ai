import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";

export function SignedOut() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold">Generate videos from a prompt</h1>
      <p className="text-muted-foreground">
        Sign in to create AI videos with your choice of model, duration, resolution, aspect ratio
        and reference frames.
      </p>
      <Button size="lg" onClick={() => setOpen(true)}>
        Get started
      </Button>
      <AuthModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
