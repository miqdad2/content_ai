import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuthForm } from "./AuthForm";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="sr-only">
          <DialogTitle>Sign in</DialogTitle>
        </DialogHeader>
        <AuthForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
