export type Transfer = {
  from_user_id: number;
  to_user_id: number;
  amount: string;
};

export type SettlementReport = {
  shamsi_year: number;
  shamsi_month: number;
  transfers: Transfer[];
};
