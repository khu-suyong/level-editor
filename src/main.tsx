import { ThemeProvider } from "@suis-ui/kit";
import { render } from "solid-js/web";

import { App } from "./App";
import "./styles/global.css";
import "./styles/global.css.ts";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element was not found.");
}

render(
  () => (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  ),
  root,
);
