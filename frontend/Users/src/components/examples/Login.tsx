import { ThemeProvider } from "../ThemeProvider";
import { AuthProvider } from "../../contexts/AuthContext";
import Login from "../../pages/Login";
import { Router } from "wouter";

export default function LoginExample() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Login />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
