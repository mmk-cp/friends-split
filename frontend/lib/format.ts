export function formatToman(value: string | number) {
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n)) return `${value} تومان`;
  const rounded = Math.round(n);
  return `${rounded.toLocaleString("fa-IR", { maximumFractionDigits: 0 })} تومان`;
}

export function onlyDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function formatThousands(value: string) {
  const digits = onlyDigits(value);
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
