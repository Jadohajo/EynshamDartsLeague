import { useState } from "react";
import { Target, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ADMIN_PASSWORD = "darts2025";
const SESSION_KEY = "admin_auth";

export default function AdminPasswordGate({ children }) {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  if (unlocked) return children;

  function handleSubmit(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setUnlocked(true);
    } else {
      setError(true);
      setPassword("");
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-wide uppercase">Admin Access</h1>
          <p className="text-sm text-muted-foreground">Enter the admin password to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            className={error ? "border-destructive" : ""}
            autoFocus
          />
          {error && <p className="text-xs text-destructive">Incorrect password. Try again.</p>}
          <Button type="submit" className="w-full" disabled={!password}>
            Unlock Admin
          </Button>
        </form>
      </div>
    </div>
  );
}