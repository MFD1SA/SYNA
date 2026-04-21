import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";

// Initialise Sentry before the React tree mounts so the first render's
// errors and any early fetch calls are instrumented.
initSentry();

createRoot(document.getElementById("root")!).render(<App />);
