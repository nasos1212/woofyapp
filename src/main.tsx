import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import "@fontsource/lora/400.css";
import "@fontsource/lora/600.css";
import "@fontsource/lora/700.css";

createRoot(document.getElementById("root")!).render(<App />);
