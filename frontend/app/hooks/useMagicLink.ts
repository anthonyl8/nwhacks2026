import { useState, useEffect } from "react";
import { supabase } from "~/lib/supabase";

export function useMagicLink() {
  const [verifying, setVerifying] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState(false);

  useEffect(() => {
    // Check if we have token_hash in URL (magic link callback)
    const params = new URLSearchParams(window.location.search);
    const token_hash = params.get("token_hash");

    if (token_hash) {
      setVerifying(true);
      // Verify the OTP token
      supabase.auth.verifyOtp({
        token_hash,
        type: "email" as const,
      }).then(({ error }) => {
        if (error) {
          setAuthError(error.message);
        } else {
          setAuthSuccess(true);
          // Clear URL params
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        setVerifying(false);
      });
    }
  }, []);

  return { verifying, authError, authSuccess, setAuthError };
}
