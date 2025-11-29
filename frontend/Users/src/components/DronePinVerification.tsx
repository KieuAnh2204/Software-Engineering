import { useEffect, useState, type KeyboardEvent } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Lock, Unlock } from "lucide-react";

const ORDER_API = import.meta.env?.VITE_ORDER_API ?? "http://localhost:3002/api/orders";
const DRONE_API = import.meta.env?.VITE_DRONE_API ?? "http://localhost:3006/api/drones";
const ARRIVAL_POLL_MS = 1000;

type Props = {
  orderId: string;
  onSuccess?: () => void;
};

export default function DronePinVerification({ orderId, onSuccess }: Props) {
  const [pin, setPin] = useState(["", "", "", ""]);
  const [droneArrived, setDroneArrived] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const { toast } = useToast();

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...pin];
    updated[index] = value.slice(-1);
    setPin(updated);
    if (value && index < 3) {
      document.getElementById(`pin-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      document.getElementById(`pin-${index - 1}`)?.focus();
    }
  };

  const pollArrival = async () => {
    if (!orderId) return;
    try {
      const res = await axios.get(`${DRONE_API}/arrival-status/${orderId}`);
      const arrived = !!res.data?.droneArrived;
      setDroneArrived(arrived);
      if (arrived && onSuccess && verified) {
        onSuccess();
      }
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.error("Arrival status error", error);
      }
    }
  };

  const handleVerify = async () => {
    if (!orderId) {
      toast({
        title: "Không tìm thấy đơn hàng",
        description: "Thiếu orderId để xác thực PIN.",
        variant: "destructive",
      });
      return;
    }

    const pinValue = pin.join("");
    if (pinValue.length !== 4) {
      toast({
        title: "PIN không hợp lệ",
        description: "Hãy nhập đủ 4 số cuối của số điện thoại đặt hàng.",
        variant: "destructive",
      });
      return;
    }

    if (!droneArrived) {
      toast({
        title: "Drone chưa tới",
        description: "Vui lòng chờ drone hạ cánh rồi thử lại.",
        variant: "destructive",
      });
      return;
    }

    try {
      setVerifying(true);
      const res = await axios.post(
        `${ORDER_API}/${orderId}/verify-pin`,
        { pin: pinValue },
        { headers: authHeaders() }
      );
      if (res.data?.success) {
        setVerified(true);
        toast({
          title: "Mở khoang thành công",
          description: "Đơn hàng đã hoàn tất. Cảm ơn bạn!",
        });
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      console.error("Verify PIN error:", error);
      toast({
        title: "Không thể xác thực",
        description: error?.response?.data?.message || "Vui lòng thử lại.",
        variant: "destructive",
      });
      setPin(["", "", "", ""]);
      document.getElementById("pin-0")?.focus();
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    pollArrival();
    const id = setInterval(pollArrival, ARRIVAL_POLL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <Card className="max-w-md w-full">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            {droneArrived ? (
              <Unlock className="h-7 w-7 text-primary" />
            ) : (
              <Lock className="h-7 w-7 text-muted-foreground" />
            )}
          </div>
        </div>
        <CardTitle className="text-2xl">Nhập mã PIN giao hàng</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Drone chỉ mở khoang khi bạn nhập 4 số cuối của số điện thoại đã đặt hàng.
        </p>
        <div className="flex justify-center mt-2">
          <Badge variant={droneArrived ? "default" : "secondary"} className="capitalize">
            {droneArrived ? "Đã tới điểm giao" : "Đang bay tới..."}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex justify-center gap-3">
          {pin.map((digit, index) => (
            <Input
              key={index}
              id={`pin-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              disabled={!droneArrived || verifying}
              value={digit}
              onChange={(e) => handlePinChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-14 h-14 text-center text-2xl font-bold"
            />
          ))}
        </div>

        <Button
          onClick={handleVerify}
          disabled={!droneArrived || verifying || pin.some((p) => !p)}
          className="w-full"
          size="lg"
        >
          {verifying ? "Đang xác thực..." : "Mở khoang"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Trạng thái drone được kiểm tra mỗi giây. Mã PIN sẽ chỉ hoạt động khi drone đã tới nơi.
        </p>
      </CardContent>
    </Card>
  );
}
