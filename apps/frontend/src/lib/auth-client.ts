import { createAuthClient } from "better-auth/react";
import { useSyncExternalStore } from "react";
import {
  DEMO_EMAIL,
  DEMO_PASSWORD,
  demoSignIn,
  demoSignOut,
  getDemoSessionSnapshot,
  isDemoMode,
  subscribeDemoSession,
} from "@/lib/demoMode";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const realAuthClient = createAuthClient({
  baseURL: `${API_URL}/api/auth`,
});

/**
 * Narrow shape covering exactly what this app's components read from
 * useSession()/signIn/signUp/signOut — deliberately not better-auth's full
 * generated type, so the real client and the demo stand-in can share one
 * exported surface. Confirmed against every current consumer of these:
 * AuthForm.tsx, Navbar.tsx, LoginPage.tsx, AdminTemplateCreatePage.tsx, useMe.ts.
 */
interface AuthSessionResult {
  data: {
    user: { id: string; name: string; email: string; image?: string | null };
  } | null;
  isPending: boolean;
  error: unknown;
}
type UseSessionHook = () => AuthSessionResult;
type SignInResult = { error: { message?: string } | null };
interface SignInClient {
  email: (creds: { email: string; password: string }) => Promise<SignInResult>;
  social: (opts: { provider: string; callbackURL?: string }) => Promise<unknown>;
}
interface SignUpClient {
  email: (creds: { email: string; password: string; name: string }) => Promise<SignInResult>;
}
type SignOutFn = () => Promise<unknown>;

function useDemoSession(): AuthSessionResult {
  const data = useSyncExternalStore(subscribeDemoSession, getDemoSessionSnapshot, () => null);
  return { data, isPending: false, error: null };
}

async function demoSignInEmail({ email, password }: { email: string; password: string }): Promise<SignInResult> {
  if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
    demoSignIn();
    return { error: null };
  }
  return { error: { message: `Invalid email or password. Try ${DEMO_EMAIL} / ${DEMO_PASSWORD}.` } };
}

async function demoSignUpEmail(): Promise<SignInResult> {
  // Frictionless in demo mode — a client walkthrough shouldn't hit a wall on
  // "Sign up" just because they typed an arbitrary email.
  demoSignIn();
  return { error: null };
}

async function demoSignInSocial(): Promise<unknown> {
  demoSignIn();
  return null;
}

async function demoSignOutFn(): Promise<unknown> {
  demoSignOut();
  return null;
}

export const useSession: UseSessionHook = isDemoMode()
  ? useDemoSession
  : (realAuthClient.useSession as unknown as UseSessionHook);

export const signIn: SignInClient = isDemoMode()
  ? { email: demoSignInEmail, social: demoSignInSocial }
  : (realAuthClient.signIn as unknown as SignInClient);

export const signUp: SignUpClient = isDemoMode()
  ? { email: demoSignUpEmail }
  : (realAuthClient.signUp as unknown as SignUpClient);

export const signOut: SignOutFn = isDemoMode()
  ? demoSignOutFn
  : (realAuthClient.signOut as unknown as SignOutFn);
