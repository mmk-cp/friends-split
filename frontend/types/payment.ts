export type Payment = {
  id: number;
  from_user_id: number;
  to_user_id: number;
  amount: string;
  description: string | null;
  payment_date: string;
  shamsi_year: number;
  shamsi_month: number;
  created_at: string;
};
