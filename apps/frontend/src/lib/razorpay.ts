/** Razorpay Checkout helper: lazily loads the script and opens the widget. */
import { DEMO_PAYMENTS_DISABLED_MESSAGE, isDemoMode } from "@/lib/demoMode";

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { email?: string; name?: string };
  theme?: { color?: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (resp: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

let loadPromise: Promise<void> | null = null;

/** Ensure the Razorpay Checkout script is loaded exactly once. */
export function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Failed to load Razorpay Checkout."));
    };
    document.body.appendChild(script);
  });
  return loadPromise;
}

/**
 * Open the Razorpay Checkout widget for the given options.
 *
 * Demo mode never loads the real script, never constructs a widget, never
 * invokes `handler` (so no fake payment id is ever produced), and never
 * reaches payment verification or credit-granting — it refuses outright.
 * `BillingPage.tsx`'s `startCheckout()` call already fails before this
 * function is ever reached (see demoMode.ts), so in practice this is a
 * second, independent guarantee rather than the primary gate.
 */
export async function openRazorpayCheckout(options: RazorpayCheckoutOptions): Promise<void> {
  if (isDemoMode()) {
    throw new Error(DEMO_PAYMENTS_DISABLED_MESSAGE);
  }
  await loadRazorpay();
  if (!window.Razorpay) throw new Error("Razorpay is unavailable.");
  const rzp = new window.Razorpay(options);
  rzp.open();
}
