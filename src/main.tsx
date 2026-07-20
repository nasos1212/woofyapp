import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initializeNativeShell } from "./lib/native";

initializeNativeShell();

createRoot(document.getElementById("root")!).render(<App />);
