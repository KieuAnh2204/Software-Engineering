import { OrderStatusStepper } from "../OrderStatusStepper";

export default function OrderStatusStepperExample() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-4">Pending</h3>
        <OrderStatusStepper currentStatus="pending" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-4">Preparing</h3>
        <OrderStatusStepper currentStatus="preparing" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-4">Delivering</h3>
        <OrderStatusStepper currentStatus="delivering" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-4">Completed</h3>
        <OrderStatusStepper currentStatus="completed" />
      </div>
    </div>
  );
}
