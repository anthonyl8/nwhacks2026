import { useRequireAuth } from "~/hooks/useRequireAuth";

export default function Detection() {
  const { session, loading } = useRequireAuth();

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
      <h1>Detection</h1>
      <p>This is the detection page. Implement your detection features here.</p>
    </div>
  );
}
