import { useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "~/lib/supabase";
import { useRequireGuest } from "~/hooks/useRequireGuest";
import { useMagicLink } from "~/hooks/useMagicLink";

export default function Login() {
  const navigate = useNavigate();
  const { loading: authLoading } = useRequireGuest();
  const { verifying, authError, authSuccess, setAuthError } = useMagicLink();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      }
    });
    if (error) {
      setAuthError(error.message);
    } else {
      alert("Check your email for the login link!");
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show verification state
  if (verifying) {
    return (
      <div>
        <h1>Authentication</h1>
        <p>Confirming your magic link...</p>
        <p>Loading...</p>
      </div>
    );
  }

  // Show auth success
  if (authSuccess) {
    return (
      <div>
        <h1>Authentication</h1>
        <p>✓ Check your email for the login link!</p>
        <p>Click the link in your email to complete login.</p>
      </div>
    );
  }

  // Show login form
  return (
    <div>
      <h1>Sign In</h1>
      <p>Sign in via magic link with your email below</p>
      {authError && (
        <div style={{ color: "red", marginBottom: "1rem" }}>
          <p>✗ {authError}</p>
        </div>
      )}
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Your email"
          value={email}
          required={true}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button disabled={loading}>
          {loading ? <span>Loading</span> : <span>Send magic link</span>}
        </button>
      </form>
    </div>
  );
}
