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
          // Default redirect to /routes/MainPageContainer.tsx if no stored path
          navigate("/routes/MainPageContainer.tsx");
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [authSuccess, session, navigate, verifying]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setAuthError(null);

    // Get the redirect path from sessionStorage or default to /mainPage
    const redirectPath = sessionStorage.getItem("redirectAfterLogin") || "/mainPage";

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
      <div className="min-h-screen bg-teal-700 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show verification state
  if (verifying) {
    return (
      <div className="min-h-screen bg-teal-700 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-light text-teal-700 mb-4 text-center">
            Authentication
          </h1>
          <p className="text-gray-700 mb-2 text-center">
            Confirming your magic link...
          </p>
          <p className="text-gray-500 text-center">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth success
  if (authSuccess) {
    return (
      <div className="min-h-screen bg-teal-700 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-light text-teal-700 mb-4 text-center">
            Authentication
          </h1>
          <p className="text-green-600 mb-2 text-center font-medium">
            ✓ Check your email for the login link!
          </p>
          <p className="text-gray-600 text-center">
            Click the link in your email to complete login.
          </p>
        </div>
      </div>
    );
  }

  // Show login form
  return (
    <div className="min-h-screen bg-teal-700 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-light text-teal-700 mb-2 text-center">
          Sign In
        </h1>
        <p className="text-gray-600 mb-6 text-center">
          Sign in via magic link with your email below
        </p>
        {authError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">✗ {authError}</p>
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Your email"
            value={email}
            required={true}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-full bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-300 border border-gray-200"
          />
          <button
            disabled={loading}
            className="w-full px-6 py-3 bg-teal-700 text-white rounded-full font-medium hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? <span>Loading</span> : <span>Send magic link</span>}
          </button>
        </form>
      </div>
    </div>
  );
}