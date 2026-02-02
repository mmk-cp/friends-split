import jalaali from "jalaali-js";

export function toJalali(gy: number, gm: number, gd: number) {
  return jalaali.toJalaali(gy, gm, gd);
}

export function toGregorian(jy: number, jm: number, jd: number) {
  return jalaali.toGregorian(jy, jm, jd);
}

export function jalaliMonthLength(jy: number, jm: number) {
  return jalaali.jalaaliMonthLength(jy, jm);
}

export function todayJalaliDate(): { year: number; month: number; day: number } {
  const d = new Date();
  const j = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return { year: j.jy, month: j.jm, day: j.jd };
}

export function todayJalaliYearMonth(): { year: number; month: number } {
  const d = new Date();
  const j = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return { year: j.jy, month: j.jm };
}

export function jalaliToGregorianISO(jy: number, jm: number, jd: number) {
  const g = toGregorian(jy, jm, jd);
  return `${g.gy}-${String(g.gm).padStart(2, "0")}-${String(g.gd).padStart(2, "0")}`;
}

export function formatJalaliDate(isoDate: string) {
  const [gy, gm, gd] = isoDate.split("-").map((v) => Number(v));
  if (!gy || !gm || !gd) return isoDate;
  const j = toJalali(gy, gm, gd);
  return `${j.jy}/${String(j.jm).padStart(2, "0")}/${String(j.jd).padStart(2, "0")}`;
}

export function jalaliMonthName(m: number) {
  const names = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
  return names[m-1] || `ماه ${m}`;
}
