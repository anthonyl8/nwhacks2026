import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/MainPageContainer.tsx"),
  route("login", "routes/login.tsx"),
  route("new-session", "routes/NewSessionContainer.tsx"),
  route("past-sessions", "routes/PastSessionsContainer.tsx"),
  route("current-session", "routes/CurrentSessionContainer.tsx")
] satisfies RouteConfig;
