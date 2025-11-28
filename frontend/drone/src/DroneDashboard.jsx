import { useState } from "react";
import { Link } from "wouter";

export default function DroneDashboard() {
  const [orderId, setOrderId] = useState("");

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-2">Drone Control Center</h2>
      <p className="text-sm text-slate-400 mb-4">
        Nhập Order ID để theo dõi hành trình hoặc xác thực PIN khi giao hàng.
      </p>

      <div className="flex flex-col gap-3 max-w-md">
        <label className="text-sm text-slate-300">Order ID</label>
        <input
          className="input"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="64b6c4..."
        />
        <div className="flex gap-2">
          <Link href={`/track/${orderId}`}>
            <button className="button" disabled={!orderId}>
              Track Delivery
            </button>
          </Link>
          <Link href={`/verify/${orderId}`}>
            <button className="button secondary" disabled={!orderId}>
              Open PIN Screen
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
