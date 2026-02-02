import jalaali from "jalaali-js";

export function toJalali(gy: number, gm: number, gd: number) {
  return jalaali.toJalaali(gy, gm, gd);
}

export function todayJalaliYearMonth(): { year: number; month: number } {
  const d = new Date();
  const j = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return { year: j.jy, month: j.jm };
}

export function jalaliMonthName(m: number) {
  const names = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
  return names[m-1] || `ماه ${m}`;
}
