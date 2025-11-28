import { useEffect, useState } from "react";
import { useParams } from "wouter";
import axios from "axios";

const DRONE_PIN_API = import.meta.env?.VITE_DRONE_PIN_API ?? "http://localhost:3002/api/drones";

export default function DronePinScreen() {
  const { orderId } = useParams();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleDigit = (value, idx) => {
    const next = [...digits];
    next[idx] = value.replace(/[^0-9]/g, "").slice(-1);
    setDigits(next);
  };

  const verify = async () => {
    const pin = digits.join("");
    if (pin.length !== 4) {
      setMessage("Nhập đủ 4 số.");
      return;
    }
    try {
      setSubmitting(true);
      setMessage("");
      await axios.post(`${DRONE_PIN_API}/${orderId}/verify-pin`, { pin });
      setMessage("Delivery completed! Drone returning.");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Wrong PIN, try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const el = document.getElementById("pin-0");
    el?.focus();
  }, []);

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Drone PIN Verification</h2>
      <p className="text-sm text-slate-400 mb-4">
        Nhập 4 số cuối số điện thoại đặt hàng để hoàn tất giao hàng.
      </p>

      <div className="pin-grid mb-3">
        {digits.map((d, idx) => (
          <input
            key={idx}
            id={`pin-${idx}`}
            className="input pin-input"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigit(e.target.value, idx)}
            onKeyUp={(e) => {
              if (e.key === "Backspace" && !d && idx > 0) {
                document.getElementById(`pin-${idx - 1}`)?.focus();
              }
              if (/^[0-9]$/.test(e.key) && idx < 3) {
                document.getElementById(`pin-${idx + 1}`)?.focus();
              }
            }}
          />
        ))}
      </div>
      <button className="button" onClick={verify} disabled={submitting}>
        {submitting ? "Verifying..." : "Verify PIN"}
      </button>
      {message && <p className="text-sm text-slate-300 mt-3">{message}</p>}
    </div>
  );
}
