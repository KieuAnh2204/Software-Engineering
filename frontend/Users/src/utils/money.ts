export const formatVND = (amount?: number | null): string => {
  if (amount === undefined || amount === null) return "0 đ";
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return "0 đ";
  return numeric.toLocaleString("vi-VN") + " đ";
};
