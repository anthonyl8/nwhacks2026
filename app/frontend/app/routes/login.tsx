import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "~/lib/supabase";
import { useRequireGuest } from "~/hooks/useRequireGuest";
import { useMagicLink } from "~/hooks/useMagicLink";
import { useAuth } from "~/hooks/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { loading: authLoading } = useRequireGuest();
  const { verifying, authError, authSuccess, setAuthError } = useMagicLink();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");

  // Handle redirect after successful authentication
  useEffect(() => {
    if (authSuccess && session && !verifying) {
      // Small delay to ensure everything is ready
      const timer = setTimeout(() => {
        // Check if there's a stored redirect path
        const redirectPath = sessionStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          // Clear the stored redirect path
          sessionStorage.removeItem("redirectAfterLogin");
          navigate(redirectPath);
        } else {
          // Default redirect to /app if no stored path
          navigate("/app");
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [authSuccess, session, navigate, verifying]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setAuthError(null);

    // Get the redirect path from sessionStorage or default to /app
    const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/app";

    // Include the redirect path in the magic link URL
    const redirectUrl = new URL(
      `${window.location.origin}/login`,
      window.location.origin
    );
    redirectUrl.searchParams.set("redirect", redirectPath);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl.toString(),
      },
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
