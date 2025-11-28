import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import axios from "axios";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const ORDER_API = import.meta.env?.VITE_ORDER_API ?? "http://localhost:3002/api/orders";

export default function OrderPinPage() {
  const params = useParams();
  const orderId = params?.orderId || "";
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const res = await axios.get(`${ORDER_API}/${orderId}`, {
        headers: getAuthHeader(),
      });
      const ord = res.data?.order || res.data;
      setOrderStatus(ord.status);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchOrder();
    const id = setInterval(fetchOrder, 2000);
    return () => clearInterval(id);
  }, [orderId]);

  useEffect(() => {
    const el = document.getElementById("pin-0");
    el?.focus();
  }, []);

  const handleDigit = (value: string, idx: number) => {
    const next = [...digits];
    next[idx] = value.replace(/[^0-9]/g, "").slice(-1);
    setDigits(next);
  };

  const verify = async () => {
    const pin = digits.join("");
    if (pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Nhập đủ 4 số",
        variant: "destructive",
      });
      return;
    }
    try {
      setSubmitting(true);
      await axios.post(`${ORDER_API}/${orderId}/verify-pin`, { pin });
      toast({ title: "Xác nhận thành công", description: "Đơn hàng đã hoàn tất" });
      setLocation(`/order-status/${orderId}`);
    } catch (err: any) {
      toast({
        title: "Sai PIN",
        description: err?.response?.data?.message || "Vui lòng thử lại",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const arrived = orderStatus === "arrived";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-xl space-y-6">
        <div className="flex items-center gap-3">
          <Link href={`/order/${orderId}/track`}>
            <Button variant="ghost" size="sm">
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Drone PIN Verification</h1>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Order #{orderId}</p>
              <Button size="sm" variant="outline" onClick={fetchOrder}>
                Refresh
              </Button>
            </div>
            <Separator />
            <p className="text-sm text-muted-foreground">
              Nhập 4 số cuối của số điện thoại đặt hàng để xác nhận giao hàng.
            </p>
            {!arrived && (
              <p className="text-xs text-amber-500">
                Drone đang di chuyển… vui lòng chờ đến khi drone đến điểm giao.
              </p>
            )}
            <div className="pin-inputs flex gap-3 justify-center">
              {digits.map((d, idx) => (
                <Input
                  key={idx}
                  id={`pin-${idx}`}
                  className="w-14 h-14 text-center text-2xl"
                  maxLength={1}
                  value={d}
                  disabled={!arrived}
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
            <Button className="w-full" onClick={verify} disabled={!arrived || submitting}>
              {arrived ? "Verify PIN" : "Waiting for drone"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
