from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

TWO_PLACES = Decimal("0.01")

def round2(x: Decimal) -> Decimal:
    return x.quantize(TWO_PLACES, rounding=ROUND_HALF_UP)

def split_evenly(amount: Decimal, participant_ids: list[int], remainder_receiver_id: int | None = None) -> dict[int, Decimal]:
    if not participant_ids:
        return {}

    amount = round2(amount)
    cents_total = int((amount * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    count = len(participant_ids)
    base = cents_total // count
    remainder = cents_total % count

    ordered = list(participant_ids)
    if remainder_receiver_id is not None and remainder_receiver_id in ordered:
        ordered.remove(remainder_receiver_id)
        ordered.insert(0, remainder_receiver_id)

    shares = {uid: Decimal(base) / 100 for uid in ordered}
    for i in range(remainder):
        uid = ordered[i]
        shares[uid] = shares[uid] + TWO_PLACES

    return shares
