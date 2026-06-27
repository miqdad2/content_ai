import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth-client";

type Mode = "signin" | "signup";

interface AuthFormProps {
  onSuccess?: () => void;
  callbackURL?: string;
}

export function AuthForm({ onSuccess, callbackURL }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result =
        mode === "signin"
          ? await signIn.email({ email, password })
          : await signUp.email({ email, password, name: name || email.split("@")[0]! });
      if (result.error) {
        setError(result.error.message ?? "Authentication failed");
      } else {
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    await signIn.social({
      provider: "google",
      callbackURL: callbackURL ?? window.location.origin,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to generate and manage your videos."
            : "Sign up to start generating videos."}
        </p>
      </div>

      <Button variant="outline" onClick={handleGoogle} type="button">
        Continue with Google
      </Button>

      <div className="relative my-1 text-center text-xs text-muted-foreground">
        <span className="relative z-10 bg-background px-2">or</span>
        <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
      </div>

      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
        {mode === "signup" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading}>
          {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          className="text-foreground underline underline-offset-4"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setPassword("");
          }}
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
