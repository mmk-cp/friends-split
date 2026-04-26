export type Transfer = {
  from_user_id: number;
  to_user_id: number;
  amount: string;
};

export type Balance = {
  user_id: number;
  balance: string;
};

export type SettlementReport = {
  balances: Balance[];
  my_balances: Balance[];
  transfers: Transfer[];
};
