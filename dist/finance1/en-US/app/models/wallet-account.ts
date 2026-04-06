export interface WalletAccount {
  id?: string;
  label: string;
  amount: number;
  currency: string;         // 'CAD' | 'XAF'
  countryCode: string;      // 'CA' | 'CM'
  usersEmail: string;
  interacEmail?: string;    // CA only
  mobileMoney?: string;     // CM only
}
