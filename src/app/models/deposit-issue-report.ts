export interface DepositIssueReport {
  id?: string;
  userEmail: string;
  countryCode: string; // 'CA' | 'CM'
  depositType: 'interac' | 'mobile_money';
  senderContact: string;
  message: string;
  attachmentCount: number;
  date: string;
  status: 'new' | 'resolved' | 'ignored';
  resolvedAt?: string;
}
