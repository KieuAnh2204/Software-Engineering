import { ThemeProvider } from "../ThemeProvider";
import { Header } from "../Header";
import { Router } from "wouter";

export default function HeaderExample() {
  return (
    <ThemeProvider>
      <Router>
        <Header />
      </Router>
    </ThemeProvider>
  );
}
