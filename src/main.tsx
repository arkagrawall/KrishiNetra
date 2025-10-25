// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // you just sent this file as App component
import "./index.css"; // your Tailwind + base styles

// Get the root div from index.html
const container = document.getElementById("app");
if (!container) throw new Error("Root element #app not found");

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
