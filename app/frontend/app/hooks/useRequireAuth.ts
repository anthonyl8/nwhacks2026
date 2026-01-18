import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "./useAuth";

export function useRequireAuth() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !session) {
      // Store the current path so we can redirect back after login
      sessionStorage.setItem("redirectAfterLogin", location.pathname);
      navigate("/login");
    }
  }, [session, loading, navigate, location.pathname]);

  return { session, loading };
}
