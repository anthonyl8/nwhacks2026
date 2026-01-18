import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("mainPage", "routes/MainPageContainer.tsx"),
  route("app", "routes/app.tsx"),
  route("login", "routes/login.tsx"),
  route("new-session", "routes/NewSessionContainer.tsx"),
  route("past-sessions", "routes/PastSessionsContainer.tsx"),
  route("new-session/current-session", "routes/CurrentSessionContainer.tsx")
] satisfies RouteConfig;
