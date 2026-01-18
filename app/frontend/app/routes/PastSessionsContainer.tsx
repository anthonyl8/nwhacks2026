import React from "react";
import { useRequireAuth } from "~/hooks/useRequireAuth";

const PastSessionsContainer: React.FC = () => {
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

  return <h1>Past Session</h1>;
};

export default PastSessionsContainer;
