export function formatToman(value: string | number) {
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n)) return `${value} تومان`;
  return `${n.toLocaleString("fa-IR")} تومان`;
}

export function onlyDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

export function formatThousands(value: string) {
  const digits = onlyDigits(value);
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
