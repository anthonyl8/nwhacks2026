import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [index("routes/home.tsx"), 
    route("detection", "routes/detection.tsx"),
    route("main-page", "routes/MainPageContainer.tsx"),
    route("new-session", "routes/CreateNewSession.tsx"),
    route("past-sessions", "routes/PastSessions.tsx")  
] satisfies RouteConfig;
