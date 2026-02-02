export type ExpenseParticipant = {
  user_id: number;
  share_amount: string;
  approved: boolean;
  approved_at: string | null;
};

export type Expense = {
  id: number;
  payer_id: number;
  amount: string;
  description: string | null;
  expense_date: string;
  shamsi_year: number;
  shamsi_month: number;
  status: "pending" | "approved";
  created_at: string;
  participants: ExpenseParticipant[];
};
