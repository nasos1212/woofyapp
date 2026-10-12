import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initializeNativeShell } from "./lib/native";
import { initSessionTracking } from "./lib/sessionTracking";

initializeNativeShell();
initSessionTracking();

createRoot(document.getElementById("root")!).render(<App />);
