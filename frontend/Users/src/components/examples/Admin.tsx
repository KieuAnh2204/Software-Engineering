import { ThemeProvider } from "../ThemeProvider";
import Admin from "../../pages/Admin";
import { Router } from "wouter";

export default function AdminExample() {
  return (
    <ThemeProvider>
      <Router>
        <Admin />
      </Router>
    </ThemeProvider>
  );
}
