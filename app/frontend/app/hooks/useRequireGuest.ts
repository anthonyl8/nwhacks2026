import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "./useAuth";

export function useRequireGuest() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && session) {
      // If we're on the login page, check if there's a magic link verification in progress
      // by checking for token_hash in URL or if we just completed verification
      if (location.pathname === "/login") {
        const params = new URLSearchParams(window.location.search);
        const token_hash = params.get("token_hash");
        // If there's a token_hash, we're in the middle of verification - let login component handle it
        if (token_hash) {
          return;
        }
        // Otherwise, if already logged in and visiting login directly, redirect
        // But check for stored redirect path first
        const redirectPath = sessionStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          sessionStorage.removeItem("redirectAfterLogin");
          navigate(redirectPath);
        } else {
          navigate("/app");
        }
        return;
      }

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
    }
  }, [session, loading, navigate, location.pathname]);

  return { session, loading };
}
