export interface WalletAccount {
  id?: string;
  label: string;
  amount: number;
  currency: string;         // 'CAD' | 'XAF'
  countryCode: string;      // 'CA' | 'CM'
  usersEmail: string;
  interacEmail?: string;    // CA only
  interacFullName?: string; // CA only — sender name shown on Interac e-Transfers
  interacAlias?: string;    // CA only — unique local part (e.g. "sylvf4jz") of the dedicated Interac receiving address
  mobileMoney?: string;     // CM only
  momoCode?: string;        // CM only — short unique reference code (e.g. "ET7K2X") the customer puts in the MoMo "reason" field
}
