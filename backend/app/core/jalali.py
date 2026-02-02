from __future__ import annotations

from datetime import date
import jdatetime

def to_shamsi_year_month(d: date) -> tuple[int, int]:
    jd = jdatetime.date.fromgregorian(date=d)
    return jd.year, jd.month
