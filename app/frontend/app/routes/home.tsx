import { Link } from "react-router";

export default function Home() {
  return (
    <div>
      <h1>Welcome to HealthSimple</h1>
      <p>Your health monitoring solution</p>
      <div>
        <Link to="/login">
          <button>Sign In</button>
        </Link>
      </div>
    </div>
  );
}
