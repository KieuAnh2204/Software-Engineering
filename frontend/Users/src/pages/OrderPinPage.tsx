import { useLocation, useParams } from "wouter";
import { Header } from "@/components/Header";
import DronePinVerification from "@/components/DronePinVerification";

export default function OrderPinPage() {
  const params = useParams();
  const orderId = params?.orderId || "";
  const [, setLocation] = useLocation();

  const handleSuccess = () => {
    setTimeout(() => setLocation(`/order-status/${orderId}`), 1200);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 flex items-center justify-center">
        <DronePinVerification orderId={orderId} onSuccess={handleSuccess} />
      </main>
    </div>
  );
}
