import { ThemeProvider } from "../ThemeProvider";
import Checkout from "../../pages/Checkout";
import { Router } from "wouter";

export default function CheckoutExample() {
  return (
    <ThemeProvider>
      <Router>
        <Checkout />
      </Router>
    </ThemeProvider>
  );
}
