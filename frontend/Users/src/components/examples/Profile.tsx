import { ThemeProvider } from "../ThemeProvider";
import Profile from "../../pages/Profile";
import { Router } from "wouter";

export default function ProfileExample() {
  return (
    <ThemeProvider>
      <Router>
        <Profile />
      </Router>
    </ThemeProvider>
  );
}
