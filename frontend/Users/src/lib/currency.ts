export const formatVND = (value?: number | string | null) => {
  const numeric = Number(value || 0);
  const formatted = new Intl.NumberFormat("vi-VN").format(Number.isNaN(numeric) ? 0 : numeric);
  return `${formatted} VNĐ`;
};
