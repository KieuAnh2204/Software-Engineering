import { formatVND } from "./money";

export function formatCurrency(amount?: number | null): string {
  return formatVND(amount ?? 0);
}
