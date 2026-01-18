import { useNavigate } from "react-router";
import { supabase } from "~/lib/supabase";
import { useRequireAuth } from "~/hooks/useRequireAuth";

export default function App() {
  const navigate = useNavigate();
  const { session, loading } = useRequireAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };
  const handleMainPage = async () => {
    navigate("/mainPage");
  };

  if (loading) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  return (
    <div>
      <h1>App Dashboard</h1>
      <p>Welcome, {session.user.email}!</p>
      <p>This is your main app page. Implement your app features here.</p>
      <button onClick={handleMainPage}>
        Click me to the main page
      </button>
      <button onClick={handleLogout}>
        Sign Out
      </button>
    </div>
  );
}
