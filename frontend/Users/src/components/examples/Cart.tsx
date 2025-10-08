import { ThemeProvider } from "../ThemeProvider";
import Cart from "../../pages/Cart";
import { Router } from "wouter";

export default function CartExample() {
  return (
    <ThemeProvider>
      <Router>
        <Cart />
      </Router>
    </ThemeProvider>
  );
}
