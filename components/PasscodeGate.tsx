"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkPasscode, isAuthed, setAuthed } from "@/lib/auth";

export default function PasscodeGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // One-shot read of localStorage at mount; only runs once so cascading renders aren't a concern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOk(isAuthed());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);

  if (!ready) {
    return <div className="min-h-screen bg-slate-50" aria-hidden />;
  }

  if (ok) return <>{children}</>;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (checkPasscode(value)) {
      setAuthed();
      setOk(true);
    } else {
      setError("Incorrect passcode");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white border border-slate-200 rounded-lg shadow-sm p-6 space-y-5"
      >
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-slate-500">LegalAI</p>
          <h1 className="text-lg font-semibold text-slate-900 mt-1">Ogata Law</h1>
          <p className="text-sm text-slate-500 mt-1">Enter passcode to continue</p>
        </div>
        <Input
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Passcode"
          autoFocus
          error={error ?? undefined}
          aria-label="Passcode"
        />
        <Button type="submit" className="w-full" disabled={submitting || !value}>
          Enter
        </Button>
      </form>
    </div>
  );
}
