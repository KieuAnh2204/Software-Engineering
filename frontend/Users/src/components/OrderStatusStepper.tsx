import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "preparing" | "delivering" | "completed";

interface Step {
  id: OrderStatus;
  label: string;
}

const steps: Step[] = [
  { id: "pending", label: "Order Placed" },
  { id: "preparing", label: "Preparing" },
  { id: "delivering", label: "Delivering by Drone" },
  { id: "completed", label: "Delivered" },
];

interface OrderStatusStepperProps {
  currentStatus: OrderStatus;
}

export function OrderStatusStepper({ currentStatus }: OrderStatusStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStatus);

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isActive = isCompleted || isCurrent;

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {index > 0 && (
                  <div
                    className={cn(
                      "flex-1 h-1 transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-muted"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-1 transition-colors",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-2 text-center hidden sm:block",
                  isActive ? "text-foreground font-medium" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
